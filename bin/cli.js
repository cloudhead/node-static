#!/usr/bin/env node

import http from 'http';
import fs from 'fs';
import tty from 'tty';
import {join, dirname} from 'path';
import {fileURLToPath} from 'url';

import {cliBasics} from 'command-line-basics';
import colors from 'colors/safe.js';

<<<<<<< HEAD
function help () {
    return `Node-Static CLI - simple, RFC 2616 compliant file streaming module for Node.

USAGE: cli.js [OPTIONS] [-p PORT] [<directory>]

Options:
    -p PORT, --port PORT
            TCP port at which the files will be served. [default: 8080]
    -a ADDRESS, --host-address ADDRESS
            The local network interface at which to listen. [default: "127.0.0.1"]
    -c SECONDS, --cache SECONDS
            "Cache-Control" header setting. [default: 3600]
    -v, --version
            Node-static version
    -H HEADERS, --headers HEADERS
            Additional headers in JSON format.
    -f FILE, --header-file FILE
            JSON file of additional headers.
    -z, --gzip
            Enable compression (tries to serve file of same name plus ".gz").
    --spa
            Serve the content as a single page app by redirecting all non-file requests to the index HTML file.
    -i FILENAME, --indexFile FILENAME
            Specify a custom index file when serving up directories. [default: "index.html"]
    -h, --help
            Display this help message.
`;
}

const args = neodoc.run(help(), {
    laxPlacement: true,
    helpFlags: ['-h', '--help']
});

const dir = args['<directory>'] || '.';

const log = function(request, response, statusCode) {
    const d = new Date();
    const seconds = d.getSeconds() < 10 ? '0' + d.getSeconds() : d.getSeconds(),
        minutes = d.getMinutes() < 10 ? '0' + d .getMinutes() : d.getMinutes(),
        hours   = d.getHours() < 10 ? '0' + d .getHours() : d.getHours(),
        datestr = hours + ':' + minutes + ':' + seconds,

        line = datestr + ' [' + response.statusCode + ']: ' + request.url;
    let colorized = line;
    if (tty.isatty(process.stdout.fd))
        colorized = (response.statusCode >= 500) ? colors.red.bold(line) :
            (response.statusCode >= 400) ? colors.red(line) :
                line;
    console.log(colorized);
};

const options = {};

if (args['--version']) {
    console.log('node-static', statik.version.join('.'));
    process.exit(0);
}

if ('--cache' in args) {
    options.cache = args['--cache']
}

if (args['--headers']) {
    options.headers = JSON.parse(args['--headers']);
}

if (args['--header-file']) {
    options.headers = JSON.parse(fs.readFileSync(args['--header-file']));
}

if (args['--gzip']) {
    options.gzip = true;
}

if (args['--index-file']) {
    options.indexFile = args['--index-file'];
}

const file = new(statik.Server)(dir, options);

<<<<<<< HEAD
var server = require('http').createServer(function (request, response) {
=======
const server = http.createServer(function (request, response) {
>>>>>>> 99710bc (Add `type: 'module'` and `exports` to `package.json`)
    request.addListener('end', function () {
        const callback = function(e, rsp) {
            if (e && e.status === 404) {
                response.writeHead(e.status, e.headers);
                response.end("Not Found");
                log(request, response);
=======
import * as statik from './../lib/node-static.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

(async () => {
    const args = await cliBasics(
        join(__dirname, 'optionDefinitions.js')
    );
    if (!args) { // cliBasics handled
        process.exit(0);
    }

    const dir = args.directory || '.';

    const log = function(request, response, statusCode) {
        const d = new Date();
        const seconds = d.getSeconds() < 10 ? '0' + d.getSeconds() : d.getSeconds(),
            minutes = d.getMinutes() < 10 ? '0' + d .getMinutes() : d.getMinutes(),
            hours   = d.getHours() < 10 ? '0' + d .getHours() : d.getHours(),
            datestr = hours + ':' + minutes + ':' + seconds,

            line = datestr + ' [' + response.statusCode + ']: ' + request.url;
        let colorized = line;
        if (tty.isatty(process.stdout.fd))
            colorized = (response.statusCode >= 500) ? colors.red.bold(line) :
                (response.statusCode >= 400) ? colors.red(line) :
                    line;
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
        options.headers = JSON.parse(fs.readFileSync(args['header-file']));
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
            const callback = function(e, rsp) {
                if (e && e.status === 404) {
                    response.writeHead(e.status, e.headers);
                    response.end("Not Found");
                    log(request, response);
                } else {
                    log(request, response);
                }
            };

            // Parsing catches:
            //   npm start -- --spa --index-file test/fixtures/there/index.html
            //   with http://127.0.0.1:8080/test/fixtures/there?email=john.cena
            if (args['spa'] && !new URL(request.url, 'http://localhost').pathname.includes(".")) {
                file.serveFile(args['index-file'], 200, {}, request, response);
>>>>>>> ea96f50 (feat: switch from neodoc to lighter command-line-basics)
            } else {
                file.serve(request, response, callback);
            }
        }).resume();
    });

    const port = args['port'] || 8080;
    const hostAddress = args['host-address'] || '127.0.0.1';

    if (hostAddress === '127.0.0.1') {
        server.listen(port);
    } else {
        server.listen(port, hostAddress);
    }

    console.log('serving "' + dir + '" at http://' + hostAddress + ':' + port);
    if (args['spa']) {
        const indexFile = args['index-file'] || 'index.html';
        console.log('serving as a single page app (all non-file requests redirect to ' + indexFile +')');
    }
})();
