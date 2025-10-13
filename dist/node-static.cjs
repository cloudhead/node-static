'use strict';

var fs = require('fs');
var events = require('events');
var http = require('http');
var path = require('path');
var mime = require('mime');
var minimatch = require('minimatch');

var _documentCurrentScript = typeof document !== 'undefined' ? document.currentScript : null;
/**
 * @typedef {{
 *   size: number,
 *   mtime: Date,
 *   ino: number
 * }} StatInfo
 */

/**
 * @param {string} dir
 * @param {string[]} files
 * @param {(errOrNull: NodeJS.ErrnoException|null, result?: StatInfo) => void} callback
 */
function mstat (dir, files, callback) {
    (function mstat(files, stats) {
        const file = files.shift();

        if (file) {
            try {
                fs.stat(path.join(dir, file), function (e, stat) {
                    if (e) {
                        callback(e);
                    } else {
                        mstat(files, stats.concat(stat));
                    }
                });
            } catch (e) {
                callback(/** @type {NodeJS.ErrnoException} */ (e));
            }
        } else {
            callback(null, {
                size: stats.reduce((total, stat) => {
                    return total + stat.size;
                }, 0),
                mtime: stats.reduce((latest, stat) => {
                    return latest > stat.mtime ? latest : stat.mtime;
                }, new Date(-864e13)),
                ino: stats.reduce((total, stat) => {
                    return total + stat.ino;
                }, 0)
            });
        }
    })(files.slice(0), /** @type {fs.Stats[]} */ ([]));
}

/**
 * @typedef {{
 *   status: number,
 *   headers: Record<string, string>,
 *   message?: string
 * }} ResultInfo
 */

/**
 * @typedef {(
 *   status: number,
 *   headers: Record<string, string>,
 *   streaming?: boolean
 * ) => void} Finish
 */

const pkg = JSON.parse(
    // @ts-expect-error Works fine
    fs.readFileSync(
        new URL('../package.json', (typeof document === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : (_documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === 'SCRIPT' && _documentCurrentScript.src || new URL('node-static.cjs', document.baseURI).href)))
    )
);

const version = pkg.version.split('.');

/**
 * @param {string} p
 * @param {(err: NodeJS.ErrnoException | null, stats?: fs.Stats) => void} callback
 */
function tryStat(p, callback) {
    try {
        fs.stat(p, callback);
    } catch (e) {
        callback(/** @type {NodeJS.ErrnoException} */ (e));
    }
}

/**
 * @typedef {{
 *   indexFile?: string,
 *   gzip?: boolean|RegExp,
 *   headers?: Record<string, string>
 *   serverInfo?: string|null,
 *   cache?: boolean|number|Record<string, number>,
 *   defaultExtension?: string
 * }} ServerOptions
 */

class Server {
    /**
     * @param {string|ServerOptions|null} [root]
     * @param {ServerOptions} [options]
     */
    constructor (root, options) {
        if (root && typeof root === 'object') { options = root; root = null; }

        // resolve() doesn't normalize (to lowercase) drive letters on Windows
        this.root    = path.normalize(path.resolve(root || '.'));
        /** @type {Required<Pick<ServerOptions, 'indexFile'>> & ServerOptions} */
        this.options = {
            indexFile: 'index.html',
            ...(options || {}),
        };

        /** @type {Record<string, number>} */
        this.cache   = {'**': 3600};

        /** @type {Record<string, string>} */
        this.defaultHeaders  = {};
        this.options.headers = this.options.headers || {};

        if ('cache' in this.options) {
            if (typeof(this.options.cache) === 'number') {
                this.cache = {'**': this.options.cache};
            } else if (typeof(this.options.cache) === 'object') {
                this.cache = this.options.cache;
            } else if (!this.options.cache) {
                this.cache = {};
            }
        }

        if ('serverInfo' in this.options && this.options.serverInfo) {
            this.serverInfo = this.options.serverInfo.toString();
        } else {
            this.serverInfo = 'node-static/' + version.join('.');
        }

        if ('defaultExtension' in this.options) {
            this.defaultExtension =  '.' + this.options.defaultExtension;
        } else {
            this.defaultExtension = null;
        }

        if (this.options.serverInfo !== null) {
            this.defaultHeaders['server'] = this.serverInfo;
        }

        for (const k in this.defaultHeaders) {
            this.options.headers[k] = this.options.headers[k] ||
                                      this.defaultHeaders[k];
        }
    }

    /**
     * @param {string} pathname
     * @param {http.IncomingMessage} req
     * @param {http.ServerResponse<http.IncomingMessage> & {
     *   req: http.IncomingMessage;
     * }} res
     * @param {(status: number, headers: Record<string, string>) => void} finish
     */
    serveDir (pathname, req, res, finish) {
        const htmlIndex = path.join(pathname, this.options.indexFile);

        tryStat(htmlIndex, (e, stat) => {
            if (!e && stat) {
                const status = 200;
                /** @type {Record<string, string>} */
                const headers = {};
                const originalPathname = decodeURIComponent(new URL(
                    /* c8 ignore next -- TS */
                    req.url ?? '',
                    'http://localhost'
                ).pathname);
                if (originalPathname.length && originalPathname.charAt(originalPathname.length - 1) !== '/') {
                    return finish(301, { Location: originalPathname + '/' });
                } else {
                    this.respond(null, status, headers, [htmlIndex], stat, req, res, finish);
                }
            } else {
                // Stream a directory of files as a single file.
                fs.readFile(path.join(pathname, 'index.json'), function (e, contents) {
                    if (e) { return finish(404, {}) }
                    const index = JSON.parse(contents.toString());
                    streamFiles(index.files);
                });
            }
        });

        /**
         * @param {string[]} files
         */
        const streamFiles = (files) => {
            mstat(pathname, files, (e, stat) => {
                if (e || !stat) { return finish(404, {}) }
                this.respond(pathname, 200, {}, files, stat, req, res, finish);
            });
        };
    }

    /**
     * @param {string} pathname
     * @param {number} status
     * @param {Record<string, string>} headers
     * @param {http.IncomingMessage} req
     * @param {http.ServerResponse<http.IncomingMessage> & {
     *   req: http.IncomingMessage;
     * }} res
     */
    serveFile (pathname, status, headers, req, res) {
        const promise = new(events.EventEmitter);

        pathname = this.resolve(pathname);

        tryStat(pathname, (e, stat) => {
            if (e || !stat) {
                return promise.emit('error', e);
            }
            this.respond(null, status, headers, [pathname], stat, req, res, (status, headers, streaming) => {
                this.finish(status, headers, req, res, promise, undefined, streaming);
            });
        });
        return promise;
    }

    /**
     * @param {number} status
     * @param {Record<string, string>} headers
     * @param {http.IncomingMessage} req
     * @param {http.ServerResponse<http.IncomingMessage> & {
     *   req: http.IncomingMessage;
     * }} res
     * @param {events<[never]>} promise
     * @param {(error: null|ResultInfo, result?: ResultInfo) => void} [callback]
     * @param {boolean} [streaming]
     */
    finish (status, headers, req, res, promise, callback, streaming) {
        const result = {
            status,
            headers,
            message: http.STATUS_CODES[status]
        };

        if (this.options.serverInfo !== null) {
            headers['server'] = this.serverInfo;
        }

        if (!status || status >= 400) {
            if (callback) {
                callback(result);
            } else {
                if (promise.listeners('error').length > 0) {
                    promise.emit('error', result);
                }
                else {
                    res.writeHead(status, headers);
                    res.end();
                }
            }
        } else {
            // Don't end the request here, if we're streaming;
            // it's taken care of in `prototype.stream`.
            if (!streaming) {
                res.writeHead(status, headers);
                res.end();
            }
            callback && callback(null, result);
            promise.emit('success', result);
        }
    }

    /**
     * @param {string} pathname
     * @param {number} status
     * @param {Record<string, string>} headers
     * @param {http.IncomingMessage} req
     * @param {http.ServerResponse<http.IncomingMessage> & {
     *   req: http.IncomingMessage;
     * }} res
     * @param {Finish} finish
     */
    servePath (pathname, status, headers, req, res, finish) {
        const promise = new(events.EventEmitter);

        pathname = this.resolve(pathname);

        // Make sure we're not trying to access a
        // file outside of the root.
        if (pathname.startsWith(this.root)) {
            tryStat(pathname, (e, stat) => {
                if (e || !stat) {
                    // possibly not found, check default extension
                    if (this.defaultExtension) {
                        tryStat(pathname + this.defaultExtension, (e2, stat2) => {
                            if (e2 || !stat2) {
                                // really not found
                                finish(404, {});
                            } else if (stat2.isFile()) {
                                this.respond(null, status, headers, [pathname + this.defaultExtension], stat2, req, res, finish);
                            /* c8 ignore next 3 -- Symblink didn't trigger */
                            } else {
                                finish(400, {});
                            }
                        });
                    } else {
                        finish(404, {});
                    }
                } else if (stat.isFile()) {      // Stream a single file.
                    this.respond(null, status, headers, [pathname], stat, req, res, finish);
                } else if (stat.isDirectory()) { // Stream a directory of files.
                    this.serveDir(pathname, req, res, finish);
                /* c8 ignore next 3 -- Symblink didn't trigger */
                } else {
                    finish(400, {});
                }
            });
        /* c8 ignore next 4 -- Not possible? */
        } else {
            // Forbidden
            finish(403, {});
        }
        return promise;
    }

    /**
     * @param {string} pathname
     */
    resolve (pathname) {
        return path.resolve(path.join(this.root, pathname));
    }

    /**
     * @param {http.IncomingMessage} req
     * @param {http.ServerResponse<http.IncomingMessage> & {
     *   req: http.IncomingMessage;
     * }} res
     * @param {(error: null|ResultInfo, result?: ResultInfo) => void} [callback]
     */
    serve (req, res, callback) {
        const promise = new(events.EventEmitter);
        let pathname;

        /**
         * @param {number} status
         * @param {Record<string, string>} headers
         * @param {boolean} [streaming]
         */
        const finish = (status, headers, streaming) => {
            this.finish(status, headers, req, res, promise, callback, streaming);
        };

        try {
            pathname = decodeURIComponent(
                new URL(
                    /* c8 ignore next -- TS */
                    req.url ?? '',
                    'http://localhost'
                ).pathname
            );
        }
        catch {
            return process.nextTick(function() {
                return finish(400, {});
            });
        }

        process.nextTick(() => {
            this.servePath(pathname, 200, {}, req, res, finish).on('success', function (result) {
                /* c8 ignore next -- How to cover? */
                promise.emit('success', result);
            }).on('error', function (err) {
                /* c8 ignore next -- How to cover? */
                promise.emit('error');
            });
        });
        if (!callback) { return promise }
    }

    /**
     * Check if we should consider sending a gzip version of the file based on the
     * file content type and client's Accept-Encoding header value.
     * @param {http.IncomingMessage} req
     * @param {string} contentType
     */
    gzipOk (req, contentType) {
        const enable = this.options.gzip;
        if(enable &&
            (typeof enable === 'boolean' ||
                (contentType && (enable instanceof RegExp) &&
                    enable.test(contentType)))
        ) {
            const acceptEncoding = req.headers['accept-encoding'];
            return acceptEncoding && acceptEncoding.includes('gzip');
        }
        return false;
    }

    /**
     * Send a gzipped version of the file if the options and the client indicate gzip is enabled and
     * we find a .gz file matching the static resource requested.
     * @param {string|null} pathname
     * @param {number} status
     * @param {string} contentType
     * @param {Record<string, string>} _headers
     * @param {string[]} files
     * @param {import('./node-static/util.js').StatInfo} stat
     * @param {http.IncomingMessage} req
     * @param {http.ServerResponse<http.IncomingMessage> & {
     *   req: http.IncomingMessage;
     * }} res
     * @param {Finish} finish
     */
    respondGzip (pathname, status, contentType, _headers, files, stat, req, res, finish) {
        if (files.length == 1 && this.gzipOk(req, contentType)) {
            const gzFile = files[0] + '.gz';
            tryStat(gzFile, (e, gzStat) => {
                if (!e && gzStat && gzStat.isFile()) {
                    const vary = _headers['Vary'];
                    _headers['Vary'] = (vary && vary != 'Accept-Encoding' ? vary + ', ' : '') + 'Accept-Encoding';
                    _headers['Content-Encoding'] = 'gzip';
                    stat.size = gzStat.size;
                    files = [gzFile];
                }
                this.respondNoGzip(pathname, status, contentType, _headers, files, stat, req, res, finish);
            });
        } else {
            // Client doesn't want gzip or we're sending multiple files
            this.respondNoGzip(pathname, status, contentType, _headers, files, stat, req, res, finish);
        }
    }

    /**
     * @param {http.IncomingMessage} req
     * @param {import('./node-static/util.js').StatInfo} stat
     */
    parseByteRange (req, stat) {
        const byteRange = {
            from: 0,
            to: 0,
            valid: false
        };

        const rangeHeader = req.headers['range'];
        const flavor = 'bytes=';

        if (rangeHeader) {
            if (rangeHeader.startsWith(flavor) && !rangeHeader.includes(',')) {
                /* Parse */
                const rangeHeaderArr = rangeHeader.slice(flavor.length).split('-');
                byteRange.from = parseInt(rangeHeaderArr[0]);
                byteRange.to = parseInt(rangeHeaderArr[1]);

                /* Replace empty fields of differential requests by absolute values */
                if (isNaN(byteRange.from) && !isNaN(byteRange.to)) {
                    byteRange.from = stat.size - byteRange.to;
                    byteRange.to = stat.size ? stat.size - 1 : 0;
                } else if (!isNaN(byteRange.from) && isNaN(byteRange.to)) {
                    byteRange.to = stat.size ? stat.size - 1 : 0;
                }

                /* General byte range validation */
                if (!isNaN(byteRange.from) && !isNaN(byteRange.to) && 0 <= byteRange.from && byteRange.from <= byteRange.to) {
                    byteRange.valid = true;
                } else {
                    console.warn('Request contains invalid range header: ', rangeHeaderArr);
                }
            } else {
                console.warn('Request contains unsupported range header: ', rangeHeader);
            }
        }
        return byteRange;
    }

    /**
     * @param {string|null} pathname
     * @param {number} status
     * @param {string} contentType
     * @param {Record<string, string>} _headers
     * @param {string[]} files
     * @param {import('./node-static/util.js').StatInfo} stat
     * @param {http.IncomingMessage} req
     * @param {http.ServerResponse<http.IncomingMessage> & {
     *   req: http.IncomingMessage;
     * }} res
     * @param {Finish} finish
     */
    respondNoGzip (pathname, status, contentType, _headers, files, stat, req, res, finish) {
        const mtime           = Date.parse(stat.mtime.toString()),
            key             = pathname || files[0],
            headers         = /** @type {Record<string, string>} */ ({}),
            clientETag      = req.headers['if-none-match'],
            clientMTime     = Date.parse(req.headers['if-modified-since'] ?? ''),
            byteRange       = this.parseByteRange(req, stat);
        let startByte       = 0,
            length          = stat.size;

        /* Handle byte ranges */
        if (files.length == 1 && byteRange.valid) {
            if (byteRange.to < length) {

                // Note: HTTP Range param is inclusive
                startByte = byteRange.from;
                length = byteRange.to - byteRange.from + 1;
                status = 206;

                // Set Content-Range response header (we advertise initial resource size on server here (stat.size))
                headers['Content-Range'] = 'bytes ' + byteRange.from + '-' + byteRange.to + '/' + stat.size;

            } else {
                byteRange.valid = false;
                console.warn('Range request exceeds file boundaries, goes until byte no', byteRange.to, 'against file size of', length, 'bytes');
            }
        }

        /* In any case, check for unhandled byte range headers */
        if (!byteRange.valid && req.headers['range']) {
            console.error(new Error('Range request present but invalid, might serve whole file instead'));
        }

        // Copy default headers
        for (const k in this.options.headers) {  headers[k] = this.options.headers[k]; }

        headers['Etag']          = JSON.stringify([stat.ino, stat.size, mtime].join('-'));
        headers['Date']          = new(Date)().toUTCString();
        headers['Last-Modified'] = new(Date)(stat.mtime).toUTCString();
        headers['Content-Type']   = contentType;
        headers['Content-Length'] = String(length);

        // Copy custom headers
        for (const k in _headers) { headers[k] = _headers[k]; }

        // Conditional GET
        // If the "If-Modified-Since" or "If-None-Match" headers
        // match the conditions, send a 304 Not Modified.
        if ((clientMTime  || clientETag) &&
            (!clientETag  || clientETag === headers['Etag']) &&
            (!clientMTime || clientMTime >= mtime)) {
            // 304 response should not contain entity headers
            ['Content-Encoding',
                'Content-Language',
                'Content-Length',
                'Content-Location',
                'Content-MD5',
                'Content-Range',
                'Content-Type',
                'Expires',
                'Last-Modified'].forEach(function (entityHeader) {
                delete headers[entityHeader];
            });
            finish(304, headers);
        } else {
            res.writeHead(status, headers);

            this.stream(key, files, length, startByte, res, function (e) {
                /* c8 ignore next -- Internal uses already checked for bad paths */
                if (e) { return finish(500, {}, true) }
                finish(status, headers, true);
            });
        }
    }

    /**
     * @param {string|null} pathname
     * @param {number} status
     * @param {Record<string, string>} _headers
     * @param {string[]} files
     * @param {import('./node-static/util.js').StatInfo} stat
     * @param {http.IncomingMessage} req
     * @param {http.ServerResponse<http.IncomingMessage> & {
     *   req: http.IncomingMessage;
     * }} res
     * @param {Finish} finish
     */
    respond (pathname, status, _headers, files, stat, req, res, finish) {
        const contentType = _headers['Content-Type'] ||
                          mime.getType(files[0]) ||
                          'application/octet-stream';
        _headers = this.setCacheHeaders(_headers, req);

        if(this.options.gzip) {
            this.respondGzip(pathname, status, contentType, _headers, files, stat, req, res, finish);
        } else {
            this.respondNoGzip(pathname, status, contentType, _headers, files, stat, req, res, finish);
        }
    }

    /**
     * @param {string|undefined} pathname
     * @param {string[]} files
     * @param {number} length
     * @param {number} startByte
     * @param {http.ServerResponse<http.IncomingMessage> & {
     *   req: http.IncomingMessage;
     * }} res
     * @param {(err: NodeJS.ErrnoException | null, offset?: number) => void} callback
     */
    stream (pathname, files, length, startByte, res, callback) {

        (function streamFile(files, offset) {
            let file = files.shift();

            if (file) {
                file = path.resolve(file) === path.normalize(file)  ? file : path.join(pathname || '.', file);

                // Stream the file to the client
                fs.createReadStream(file, {
                    flags: 'r',
                    mode: 0o666,
                    start: startByte,
                    end: startByte + (length ? length - 1 : 0)
                }).on('data', function (chunk) {
                    // Bounds check the incoming chunk and offset, as copying
                    // a buffer from an invalid offset will throw an error and crash
                    if (chunk.length && offset < length && offset >= 0) {
                        offset += chunk.length;
                    }
                }).on('close', function () {
                    streamFile(files, offset);
                }).on('error', function (err) {
                    callback(err);
                    console.error(err);
                }).pipe(res, { end: false });
            } else {
                res.end();
                callback(null, offset);
            }
        })(files.slice(0), 0);
    }

    /**
     * @param {Record<string, string>} _headers
     * @param {http.IncomingMessage} req
     */
    setCacheHeaders (_headers, req) {
        /* c8 ignore next 3 -- TS */
        if (!req.url) {
            return _headers;
        }
        const maxAge = this.getMaxAge(req.url);
        if (typeof(maxAge) === 'number') {
            _headers['cache-control'] = 'max-age=' + maxAge;
        }
        return _headers;
    }

    /**
     * @param {string} requestUrl
     */
    getMaxAge (requestUrl) {
        if (this.cache) {
            for (const pattern in this.cache) {
                if (minimatch.minimatch(requestUrl, pattern)) {
                    return this.cache[pattern];
                }
            }
        }
        return false;
    }
}

exports.mime = mime;
exports.Server = Server;
exports.version = version;
