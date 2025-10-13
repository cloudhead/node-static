#!/usr/bin/env node

import http from 'http';
import fs from 'fs';
import tty from 'tty';

import {cliBasics} from 'command-line-basics';
import colors from 'colors/safe.js';

import * as statik from './../lib/node-static.js';

const args = await cliBasics(
    import.meta.dirname + '/optionDefinitions.js',
    {
        packageJsonPath: import.meta.dirname + '/../package.json'
    }
);
if (!args) { // cliBasics handled
    process.exit(0);
}

const dir = args.directory || '.';

/**
 * @param {http.IncomingMessage} request
 * @param {http.ServerResponse<http.IncomingMessage> & {
 *   req: http.IncomingMessage;
 * }} response
 * @param {number} [statusCode]
 */
const log = function(request, response, statusCode) {
    const d = new Date();
    /* c8 ignore next 3 -- Time-dependent */
    const seconds = d.getSeconds() < 10 ? '0' + d.getSeconds() : d.getSeconds(),
        minutes = d.getMinutes() < 10 ? '0' + d .getMinutes() : d.getMinutes(),
        hours   = d.getHours() < 10 ? '0' + d .getHours() : d.getHours(),
        datestr = hours + ':' + minutes + ':' + seconds,

        line = datestr + ' [' + response.statusCode + ']: ' + request.url;
    let colorized = line;
    /* c8 ignore next 7 -- Environment */
    if (tty.isatty(process.stdout.fd)) {
        colorized = (response.statusCode >= 500)
            // @ts-expect-error TS error
            ? colors.red.bold(line)
            : (response.statusCode >= 400) ? colors.red(line) :
                line;
    }
    console.log(colorized);
};

const options = {};

if ('cache' in args) {
    options.cache = args['cache']
}

if (args['headers']) {
    options.headers = JSON.parse(args['headers']);
}

if (args['header-file']) {
    options.headers = JSON.parse(
        // @ts-expect-error Works fine
        fs.readFileSync(args['header-file'])
    );
}

if (args['gzip']) {
    options.gzip = true;
}

if (args['index-file']) {
    options.indexFile = args['index-file'];
}

const file = new(statik.Server)(dir, options);

const server = http.createServer(function (request, response) {
    request.addListener('end', function () {
        /**
         * @param {null|import('../lib/node-static.js').ResultInfo} e
         * @param {import('../lib/node-static.js').ResultInfo} [rsp]
         */
        const callback = function(e, rsp) {
            if (e && e.status === 404) {
                response.writeHead(e.status, e.headers);
                response.end("Not Found");
                log(request, response);
            } else {
                log(request, response);
            }
        };

        /* c8 ignore next 3 -- TS guard */
        if (typeof request.url !== 'string') {
            return;
        }

        // Parsing catches:
        //   npm start -- --spa --index-file test/fixtures/there/index.html
        //   with http://127.0.0.1:8080/test/fixtures/there?email=john.cena
        if (args['spa'] && !new URL(request.url, 'http://localhost').pathname.includes(".")) {
            file.serveFile(args['index-file'] || 'index.html', 200, {}, request, response);
        } else {
            file.serve(request, response, callback);
        }
    }).resume();
});

const port = args['port'] || 8080;
const hostAddress = args['host-address'] || '127.0.0.1';

if (hostAddress === '127.0.0.1') {
    server.listen(port);
/* c8 ignore next 3 -- Not working with localhost or 0.0.0.0 */
} else {
    server.listen(port, hostAddress);
}

console.log('serving "' + dir + '" at http://' + hostAddress + ':' + port);
if (args['spa']) {
    const indexFile = args['index-file'] || 'index.html';
    console.log('serving as a single page app (all non-file requests redirect to ' + indexFile +')');
}
