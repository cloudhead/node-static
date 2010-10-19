var fs = require('fs'),
    sys = require('sys'),
    events = require('events'),
    buffer = require('buffer'),
    http = require('http'),
    url = require('url'),
    path = require('path');

this.version = [0, 5, 1];

var mime = require('./node-static/mime');
var util = require('./node-static/util');

var serverInfo = 'node-static/' + this.version.join('.');

// In-memory file store
this.store = {};
this.indexStore = {};

// returns false if error parsing.
// otherwise returns a list of {start:n, stop:n, length:n}
var parseRangeHeader = function (header, totalSize) {
    var parts = header.split('=');
    if (parts[0] != 'bytes') {
        sys.log('Bad range: Only byte ranges are supported');
        return false;
    }

    if (parts.length > 2) {
        sys.log('Bad range: (multiple =) ' + header);
        return false;
    }

    var ranges = parts[1].split(',');
    var segments = [];
    ranges.forEach(function (range) {
        var sep = range.indexOf('-');
        if (sep == -1) {
            sys.log('Bad range: No "-" found ' + range);
            return false;
        }

        var obj = {};
        var start = range.slice(0, sep);
        var end = range.slice(sep+1);
        if (!start) {
            // request from the end
            if (!end) {
                sys.log('Bad range: No end byte for empty start byte ' + range);
                return false;
            }

            // TODO validate actual numbers
            obj.end = totalSize;
            obj.length = parseInt(end);
            obj.start = totalSize - obj.length;
        }
        else {
            obj.start = parseInt(start);
            if (end) {
                obj.end = parseInt(end);
                if (obj.end < obj.start) {
                    sys.log('Bad range: end < start ' + range);
                    return false;
                }
            }
            else {
                obj.end = totalSize-1;
            }
            obj.length = obj.end - obj.start + 1;
        }

        segments.push(obj);
    });

    return segments;
}

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

    if ('stripPrefix' in this.options) {
        if (typeof(this.options.stripPrefix) === 'string') {
            this.stripPrefix = '/' + path.normalize(this.options.stripPrefix).replace(/\/$/, '').replace(/^\//, '') + '/';
        } else if (! this.options.stripPrefix) {
            this.stripPrefix = '';
        }
    } else {
        this.stripPrefix = '';
    }
};

this.Server.prototype.serveDir = function (pathname, req, res, finish) {
    var htmlIndex = path.join(pathname, 'index.html'),
        that = this;

    fs.stat(htmlIndex, function (e, stat) {
        if (!e) {
            that.respond(pathname, 200, {}, ['index.html'], stat, req, res, finish);
        } else {
            if (pathname in exports.store) {
                streamFiles(exports.indexStore[pathname].files);
            } else {
                // Stream a directory of files as a single file.
                fs.readFile(path.join(pathname, 'index.json'), function (e, contents) {
                    if (e) { return finish(404, {}) }
                    var index = JSON.parse(contents);
                    exports.indexStore[pathname] = index;
                    streamFiles(index.files);
                });
            }
        }
    });
    function streamFiles(files) {
        util.mstat(pathname, files, function (e, stat) {
            that.respond(pathname, 200, {}, files, stat, req, res, finish);
        });
    }
};
this.Server.prototype.serveFile = function (pathname, status, headers, req, res) {
    var that = this;
    var promise = new(events.EventEmitter);

    pathname = this.normalize(pathname);

    fs.stat(pathname, function (e, stat) {
        if (e) {
            return promise.emit('error', e);
        }
        that.respond(path.dirname(pathname), status, headers, [path.basename(pathname)], stat, req, res, function (status, headers) {
            that.finish(status, headers, req, res, promise);
        });
    });
    return promise;
};
this.Server.prototype.finish = function (status, headers, req, res, promise, callback) {
    var result = {
        status:  status,
        headers: headers,
        message: http.STATUS_CODES[status]
    };

    headers['Server'] = serverInfo;

    if (!status || status >= 400) {
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
};

this.Server.prototype.servePath = function (pathname, status, headers, req, res, finish) {
    var that = this,
        promise = new(events.EventEmitter);

    pathname = this.normalize(pathname);

    // Only allow GET and HEAD requests
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        finish(405, { 'Allow': 'GET, HEAD' });
        return promise;
    }

    // Make sure we're not trying to access a
    // file outside of the root.
    if (new(RegExp)('^' + that.root).test(pathname)) {
        fs.stat(pathname, function (e, stat) {
            if (e) {
                finish(404, {});
            } else if (stat.isFile()) {      // Stream a single file.
                that.respond(path.dirname(pathname), status, headers, [path.basename(pathname)], stat, req, res, finish);
            } else if (stat.isDirectory()) { // Stream a directory of files.
                that.serveDir(pathname, req, res, finish);
            } else {
                finish(400, {});
            }
        });
    } else {
        // Forbidden
        finish(403, {});
    }
    return promise;
};
this.Server.prototype.normalize = function (pathname) {
    return path.normalize(path.join(this.root, pathname));
};
this.Server.prototype.serve = function (req, res, callback) {
    var that = this,
        promise = new(events.EventEmitter);

    var pathname = url.parse(req.url).pathname;
    if (pathname.indexOf(this.stripPrefix) == 0) {
        pathname = '/' + pathname.slice(this.stripPrefix.length);
    } else {
        callback({ status: 403, headers: {}, message: 'Prefix match failure on ' + pathname + ' with prefix ' + this.stripPrefix});
        return promise;
    }

    var finish = function (status, headers) {
        that.finish(status, headers, req, res, promise, callback);
    };

    process.nextTick(function () {
        that.servePath(pathname, 200, {}, req, res, finish).on('success', function (result) {
            promise.emit('success', result);
        }).on('error', function (err) {
            promise.emit('error');
        });
    });
    if (! callback) { return promise }
};

this.Server.prototype.respond = function (pathname, status, _headers, files, stat, req, res, finish) {
    var mtime   = Date.parse(stat.mtime),
        key     = pathname || files[0],
        headers = {};

    // Copy default headers
    for (var k in this.options.headers) {  headers[k] = this.options.headers[k] }

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

        var query = url.parse(req.url, true).query;
        var range = query ? query.ns_range : undefined;
        if( req.headers['range'] )
            range = req.headers['range'];

        if( range ) {
            var ranges = parseRangeHeader(range, stat.size);
            if( ranges ) {
                sys.debug('Ranges:' + sys.inspect(ranges));
                // TODO: we can't really handle multiple ranges right now
                var first = ranges[0];
                headers['Content-Length'] = first.length;
                headers['Content-Range'] = 'bytes ' + first.start + '-' + first.end + '/' + stat.size;
                res.range = first;
            }
        }

        for (var k in headers) { _headers[k] = headers[k] }

        res.writeHead(status, _headers);

        // If the file was cached and it's not older
        // than what's on disk, serve the cached version.
        if (this.cache && (key in exports.store) &&
            exports.store[key].stat.mtime >= stat.mtime) {
            res.end(exports.store[key].buffer);
            finish(status, _headers);
        } else {
            this.stream(pathname, files, new(buffer.Buffer)(res.range ? res.range.length : stat.size), res, function (e, buffer) {
                if (e) { return finish(500, {}) }
                exports.store[key] = {
                    stat:      stat,
                    buffer:    buffer,
                    timestamp: Date.now()
                };
                finish(status, _headers);
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
                mode: 0666,
                bufferSize: 4096,
                start: res.range ? res.range.start : 0,
                end: res.range ? res.range.end : buffer.length
            }).addListener('data', function (chunk) {
                chunk.copy(buffer, offset, 0);
                res.write   (chunk, 'binary');
                offset    += chunk.length;
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
