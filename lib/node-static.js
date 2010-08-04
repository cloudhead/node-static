var fs = require('fs'),
    sys = require('sys'),
    events = require('events'),
    buffer = require('buffer'),
    http = require('http'),
    url = require('url'),
    path = require('path');

this.version = [0, 4, 2];

var mime = require('./node-static/mime');
var util = require('./node-static/util');

var serverInfo = 'node-static/' + this.version.join('.');

// In-memory file store
this.store = {};
this.indexStore = {};

this.Server = function (root, options) {
    if (root && (typeof(root) === 'object')) { options = root, root = null }

    this.root    = path.normalize(root || '.');
    this.options = options || {};
    this.cache   = 3600;

    this.defaultHeaders  = {};
    this.options.headers = this.options.headers || {};

    if ('cache' in this.options) {
        if (typeof(this.options.cache) === 'number') {
            this.cache = this.options.cache;
        } else if (! this.options.cache) {
            this.cache = false;
        }
    }

    if (this.cache !== false) {
        this.defaultHeaders['Cache-Control'] = 'max-age=' + this.cache;
    }
    this.defaultHeaders['Server'] = serverInfo;

    for (var k in this.defaultHeaders) {
        this.options.headers[k] = this.options.headers[k] ||
                                  this.defaultHeaders[k];
    }
};

this.Server.prototype.serveFile = function (pathname, req, res, callback) {
    var that = this,
        promise = new(events.EventEmitter);

    process.nextTick(function () {
        // Only allow GET and HEAD requests
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            return finish(405, { 'Allow': 'GET, HEAD' });
        }

        pathname = path.normalize(path.join(that.root, pathname));

        // Make sure we're not trying to access a
        // file outside of the root.
        if (new(RegExp)('^' + that.root).test(pathname)) {
            fs.stat(pathname, function (e, stat) {
                var htmlIndex = path.join(pathname, 'index.html');

                if (e) {
                    finish(404, {});
                } else if (stat.isFile()) {
                    // Stream a single file.
                    that.respond(null, [pathname], stat, req, res, finish);

                } else if (stat.isDirectory()) {
                    path.exists(htmlIndex, function (exists) {
                        if (exists) {
                            that.respond(null, [htmlIndex], stat, req, res, finish);
                        } else {
                            if (pathname in exports.store) {
                                util.mstat(pathname, exports.indexStore[pathname].files, function (e, stat) {
                                    that.respond(pathname, exports.indexStore[pathname].files, stat, req, res, finish);
                                });
                            } else {
                                // Stream a directory of files as a single file.
                                fs.readFile(path.join(pathname, 'index.json'), function (e, contents) {
                                    if (e) { return finish(404, {}) }
                                    var index = JSON.parse(contents);

                                    exports.indexStore[pathname] = index;

                                    util.mstat(pathname, index.files, function (e, stat) {
                                        that.respond(pathname, index.files, stat, req, res, finish);
                                    });
                                });
                            }
                        }
                    });
                } else {
                    finish(400, {});
                }
            });
        } else {
            // Forbidden
            finish(403, {});
        }
    });

    return promise;

    function finish(status, headers) {
        var result = {
            status:  status,
            headers: headers,
            message: http.STATUS_CODES[status]
        };

        headers['Server'] = serverInfo;

        if (status >= 400) {
            if (callback) {
                callback(result);
            } else {
                if (promise.listeners('error').length > 0) {
                    promise.emit('error', result);
                }
                res.writeHead(status, headers);
                res.end();
            }
        } else {
            // Don't end the request here, if we're streaming;
            // it's taken care of in `prototype.stream`.
            if (status !== 200 || req.method !== 'GET') {
                res.writeHead(status, headers);
                res.end();
            }
            callback && callback(null, result);
            promise.emit('success', result);
        }
    }
};
this.Server.prototype.serve = function (req, res, callback) {
    var that = this,
        promise = new(events.EventEmitter);

    process.nextTick(function () {
        var file = url.parse(req.url).pathname;

        that.serveFile(file, req, res, callback).addListener('success', function (result) {
            promise.emit('success', result);
        }).addListener('error', function (result) {
            if (promise.listeners('error').length > 0) {
                promise.emit('error', result);
            }
        });
    });
    return promise;
};

this.Server.prototype.respond = function (pathname, files, stat, req, res, finish) {
    var mtime   = Date.parse(stat.mtime),
        key     = pathname || files[0],
        headers = {};

    // Copy default headers
    for (var k in this.options.headers) { headers[k] = this.options.headers[k] }

    headers['Etag']          = JSON.stringify([stat.ino, stat.size, mtime].join('-'));
    headers['Date']          = new(Date)().toUTCString();
    headers['Last-Modified'] = new(Date)(stat.mtime).toUTCString();

    // Conditional GET
    // If both the "If-Modified-Since" and "If-None-Match" headers
    // match the conditions, send a 304 Not Modified.
    if (req.headers['if-none-match'] === headers['Etag'] &&
        Date.parse(req.headers['if-modified-since']) >= mtime) {
        finish(304, headers);
    } else if (req.method === 'HEAD') {
        finish(200, headers);
    } else {
        headers['Content-Length'] = stat.size;
        headers['Content-Type']   = mime.contentTypes[path.extname(files[0]).slice(1)] ||
                                   'application/octet-stream';

        res.writeHead(200, headers);

        // If the file was cached and it's not older
        // than what's on disk, serve the cached version.
        if (this.cache && (key in exports.store) &&
            exports.store[key].stat.mtime >= stat.mtime) {
            res.end(exports.store[key].buffer);
            finish(200, {});
        } else {
            this.stream(pathname, files, new(buffer.Buffer)(stat.size), res, function (e, buffer) {
                if (e) { return finish(500, {}) }
                exports.store[key] = {
                    stat:      stat,
                    buffer:    buffer,
                    timestamp: Date.now()
                };
                finish(200, {});
            });
        }
    }
};

this.Server.prototype.stream = function (pathname, files, buffer, res, callback) {
    (function streamFile(files, offset) {
        var file = files.shift();

        if (file) {
            // Stream the file to the client
            fs.createReadStream(path.join(pathname || '.', file), {
                flags: 'r',
                encoding: 'binary',
                mode: 0666,
                bufferSize: 4096
            }).addListener('data', function (chunk) {
                chunk.copy (buffer, offset, 0);
                res.write  (chunk, 'binary');
                offset   += chunk.length;
            }).addListener('close', function () {
                streamFile(files, offset);
            }).addListener('error', function (err) {
                callback(err);
                sys.error(err);
            });
        } else {
            res.end();
            callback(null, buffer, offset);
        }
    })(files.slice(0), 0);
};
