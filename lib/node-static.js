var fs = require('fs'),
    sys = require('sys'),
    events = require('events'),
    buffer = require('buffer'),
    http = require('http'),
    url = require('url'),
    path = require('path');

this.version = [0, 5, 9];

var mime = require('./node-static/mime');
var util = require('./node-static/util');

var serverInfo = 'node-static/' + this.version.join('.');

this.Server = function (root, options) {
    if (root && (typeof(root) === 'object')) { options = root, root = null }

    this.root    = path.resolve(root || '.');
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

this.Server.prototype.serveDir = function (pathname, req, res, finish) {
    var htmlIndex = path.join(pathname, 'index.html'),
        that = this;

    fs.stat(htmlIndex, function (e, stat) {
        if (!e) {
            that.respond(null, 200, {}, [htmlIndex], stat, req, res, finish);
        } else {
            // Stream a directory of files as a single file.
            fs.readFile(path.join(pathname, 'index.json'), function (e, contents) {
                if (e) { return finish(404, {}) }
                var index = JSON.parse(contents);
                streamFiles(index.files);
            });
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

    pathname = this.resolve(pathname);

    fs.stat(pathname, function (e, stat) {
        if (e) {
            return promise.emit('error', e);
        }
        that.respond(null, status, headers, [pathname], stat, req, res, function (status, headers) {
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

    pathname = this.resolve(pathname);

    // Only allow GET and HEAD requests
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        finish(405, { 'Allow': 'GET, HEAD' });
        return promise;
    }

    // Make sure we're not trying to access a
    // file outside of the root.
    if (pathname.indexOf(that.root) === 0) {
        fs.stat(pathname, function (e, stat) {
            if (e) {
                finish(404, {});
            } else if (stat.isFile()) {      // Stream a single file.
                that.respond(null, status, headers, [pathname], stat, req, res, finish);
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
this.Server.prototype.resolve = function (pathname) {
    return path.resolve(path.join(this.root, pathname));
};
this.Server.prototype.serve = function (req, res, callback) {
    var that = this,
        promise = new(events.EventEmitter);
    
    var pathname = decodeURI(url.parse(req.url).pathname);

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

/* Check if we should consider sending a gzip version of the file based on the
 * file content type and client's Accept-Encoding header value.
 */
this.Server.prototype.gzipOk = function(req, contentType) {
    var enable = this.options.gzip;
    if(enable && 
        (typeof enable === 'boolean' || 
            (contentType && (enable instanceof RegExp) && enable.test(contentType)))) {
        var acceptEncoding = req.headers['accept-encoding'];
        return acceptEncoding && acceptEncoding.indexOf("gzip") >= 0;
    }
    return false;
}

/* Send a gzipped version of the file if the options and the client indicate gzip is enabled and
 * we find a .gz file mathing the static resource requested. 
 */
this.Server.prototype.respondGzip = function(pathname, status, contentType, _headers, files, stat, req, res, finish) {
    var that = this;
    if(files.length == 1 && this.gzipOk(req)) {
        var gzFile = files[0] + ".gz";
        fs.stat(gzFile, function(e, gzStat) {
            if(!e && gzStat.isFile()) {
                //console.log('Serving', gzFile, 'to gzip-capable client instead of', files[0], 'new size is', gzStat.size, 'uncompressed size', stat.size);
                var vary = _headers['Vary'];
                _headers['Vary'] = (vary && vary != 'Accept-Encoding'?vary+', ':'')+'Accept-Encoding';
                _headers['Content-Encoding'] = 'gzip';
                stat.size = gzStat.size;
                files = [gzFile];
				if (key.substr(-5)==".woff" || key.substr(-4)==".ttf" || key.substr(-4)==".eot"){
					headers['Access-Control-Allow-Origin'] = "http://ejraee.ir";
				}
				if (key.substr(-3)== ".gz"){
					headers['Content-Encoding'] = "gzip";
					if (key.substr(-6)== ".js.gz")
						headers['Content-Type']   = "application/x-javascript";
					else if (key.substr(-7)== ".css.gz")
						headers['Content-Type']   = "text/css";
				}
            } else {
                //console.log('gzip file not found or error finding it', gzFile, String(e), stat.isFile());
            }
            that.respondNoGzip(pathname, status, contentType, _headers, files, stat, req, res, finish);
        });
    } else {
        // Client doesn't want gzip or we're sending multiple files
        that.respondNoGzip(pathname, status, contentType, _headers, files, stat, req, res, finish);
    }
}

this.Server.prototype.respondNoGzip = function (pathname, status, contentType, _headers, files, stat, req, res, finish) {
    var mtime   = Date.parse(stat.mtime),
        key     = pathname || files[0],
        headers = {};

    // Copy default headers
    for (var k in this.options.headers) {  headers[k] = this.options.headers[k] }

    headers['Etag']          = JSON.stringify([stat.ino, stat.size, mtime].join('-'));
    headers['Date']          = new(Date)().toUTCString();
    headers['Last-Modified'] = new(Date)(stat.mtime).toUTCString();
    headers['Content-Type']   = contentType;
    headers['Content-Length'] = stat.size;
    
    for (var k in _headers) { headers[k] = _headers[k] }

    // Conditional GET
    // If the "If-Modified-Since" or "If-None-Match" headers
    // match the conditions, send a 304 Not Modified.
    if (req.headers['if-none-match'] === headers['Etag'] ||
        Date.parse(req.headers['if-modified-since']) >= mtime) {
        // 304 response should not contain entity headers
        ['Content-Encoding',
         'Content-Language', 
         'Content-Length', 
         'Content-Location', 
         'Content-MD5', 
         'Content-Range', 
         'Content-Type', 
         'Expires',
         'Last-Modified'].forEach(function(entityHeader) {
            delete headers[entityHeader];
        });
        finish(304, headers);
    } else if (req.method === 'HEAD') {
        finish(200, headers);
    } else {
        res.writeHead(status, headers);

        this.stream(pathname, files, new(buffer.Buffer)(stat.size), res, function (e, buffer) {
            if (e) { return finish(500, {}) }
            finish(status, headers);
        });
    }
};

this.Server.prototype.respond = function (pathname, status, _headers, files, stat, req, res, finish) {
    var contentType = _headers['Content-Type'] || 
                      mime.contentTypes[path.extname(files[0]).slice(1)] ||
                      'application/octet-stream';
    if(this.options.gzip) {
        this.respondGzip(pathname, status, contentType, _headers, files, stat, req, res, finish);
    } else {
        this.respondNoGzip(pathname, status, contentType, _headers, files, stat, req, res, finish);
    }
}

this.Server.prototype.stream = function (pathname, files, buffer, res, callback) {
    (function streamFile(files, offset) {
        var file = files.shift();

        if (file) {
            file = file[0] === '/' ? file : path.join(pathname || '.', file);

            // Stream the file to the client
            fs.createReadStream(file, {
                flags: 'r',
                mode: 0666
            }).on('data', function (chunk) {
                chunk.copy(buffer, offset);
                offset += chunk.length;
            }).on('close', function () {
                streamFile(files, offset);
            }).on('error', function (err) {
                callback(err);
                console.error(err);
            }).pipe(res, { end: false });
        } else {
            res.end();
            callback(null, buffer, offset);
        }
    })(files.slice(0), 0);
};
