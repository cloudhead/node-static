#!/usr/bin/env node

'use strict';

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

const fs = require('fs'),
    tty = require('tty'),
    url = require('url'),
    statik = require('./../lib/node-static'),
    neodoc = require('neodoc'),
    colors = require('colors/safe');

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
    console.log('@brettz9/node-static', statik.version.join('.'));
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

const server = require('http').createServer(function (request, response) {
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
        //   npm start -- --spa --indexFile test/fixtures/there/index.html
        //   with http://127.0.0.1:8080/test/fixtures/there?email=john.cena
        if (args['spa'] && !url.parse(request.url).pathname.includes(".")) {
            file.serveFile(args['--index-file'], 200, {}, request, response);
        } else {
            file.serve(request, response, callback);
        }
    }).resume();
});

if (args['host-address'] === '127.0.0.1') {
    server.listen(+args['--port']);
} else {
    server.listen(+args['--port'], args['--host-address']);
}

console.log('serving "' + dir + '" at http://' + args['--host-address'] + ':' + args['--port']);
if (args['--spa']) {
    console.log('serving as a single page app (all non-file requests redirect to ' + args['--index-file'] +')');
}
