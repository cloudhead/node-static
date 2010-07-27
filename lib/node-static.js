var fs = require('fs'),
    url = require('url'),
    path = require('path');

var mime = require('./node-static/mime');

this.Server = function (root, options) {
    this.root    = path.normalize(root || '.');
    this.options = options || {};
    this.logger  = this.options.logger || function () {};
};

this.Server.prototype.serve = function (req, res, errback) {
    var that = this;

    process.nextTick(function () {
        var file = url.parse(req.url).pathname;

        // Only allow GET and HEAD requests
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            error(405, { 'Allow': 'GET, HEAD' });
        }

        // If we're trying to load a directory, look for
        // an index.html inside of it.
        if (/\/$/.test(file)) { file += 'index.html' }

        file = path.normalize(path.join(that.root, file));

        // Make sure we're not trying to access a
        // file outside of the root.
        if (new(RegExp)('^' + that.root).test(file)) {
            fs.stat(file, function (e, stat) {
                if (e || !stat.isFile()) {
                    error(404, {});
                } else {
                    that.stream(file, stat, req, res);
                }
            });
        } else {
            // Forbidden
            error(403, {});
        }
    });

    function error(status, headers) {
        if (typeof(errback) === 'function') {
            errback(status, headers);
        } else {
            res.writeHead(status, headers);
            res.end();
        }
    }
};

this.Server.prototype.stream = function (file, stat, req, res) {
    var mtime = Date.parse(stat.mtime);
    var headers = {
        'Etag':           JSON.stringify([stat.ino, stat.size, mtime].join('-')),
        'Date':           new(Date)().toUTCString(),
        'Server':        'node-static/' + exports.version.join('.'),
        'cache-control': 'max-age=' + this.options.cache || 3600,
        'last-modified':  new(Date)(stat.mtime).toUTCString()
    };

    // Conditional GET
    // If both the "If-Modified-Since" and "If-None-Match" headers
    // match the conditions, send a 304 Not Modified.
    if (req.headers['if-none-match'] === headers['Etag'] &&
        Date.parse(req.headers['if-modified-since']) > mtime) {
        res.writeHead(304, headers);
        res.end();
    } else if (req.method === 'HEAD') {
        res.writeHead(200, headers);
        res.end();
    } else {
        headers['Content-Length'] = stat.size;
        headers['Content-Type']   = mime.contentTypes[path.extname(file).slice(1)] ||
                                   'application/octet-stream';

        res.writeHead(200, headers);

        // Stream the file to the client
        fs.createReadStream(file, {
            flags: 'r',
            encoding: 'binary',
            mode: 0666,
            bufferSize: 4096
        }).addListener('data', function (chunk) {
            res.write(chunk, 'binary');
        }).addListener('close', function () {
            res.end();
        }).addListener('error', function (err) {
            sys.error(err);
        });
    }
};

this.version = [0, 1, 0];
