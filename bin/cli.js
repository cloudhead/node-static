#!/usr/bin/env node

'use strict';

const fs = require('fs'),
    tty = require('tty'),
    url = require('url'),
    statik = require('./../lib/node-static');

const argv = require('optimist')
    .usage([
        'USAGE: $0 [-p <port>] [<directory>]',
        'simple, rfc 2616 compliant file streaming module for node']
        .join('\n\n'))
    .option('port', {
        alias: 'p',
        'default': 8080,
        description: 'TCP port at which the files will be served'
    })
    .option('host-address', {
        alias: 'a',
        'default': '127.0.0.1',
        description: 'the local network interface at which to listen'
    })
    .option('cache', {
        alias: 'c',
        description: '"Cache-Control" header setting, defaults to 3600'
    })
    .option('version', {
        alias: 'v',
        description: '@brettz9/node-static version'
    })
    .option('headers', {
        alias: 'H',
        description: 'additional headers (in JSON format)'
    })
    .option('header-file', {
        alias: 'f',
        description: 'JSON file of additional headers'
    })
    .option('gzip', {
        alias: 'z',
        description: 'enable compression (tries to serve file of same name plus \'.gz\')'
    })
    .option('spa', {
        description: 'serve the content as a single page app by redirecting all non-file requests to the index html file'
    })
    .option('indexFile', {
        alias: 'i',
        'default': 'index.html',
        description: 'specify a custom index file when serving up directories'
    })
    .option('help', {
        alias: 'h',
        description: 'display this help message'
    })
    .argv;

const dir = argv._[0] || '.';

// const colors = require('colors');

const log = function(request, response, statusCode) {
    const d = new Date();
    const seconds = d.getSeconds() < 10 ? '0' + d.getSeconds() : d.getSeconds(),
        minutes = d.getMinutes() < 10 ? '0' + d .getMinutes() : d.getMinutes(),
        hours   = d.getHours() < 10 ? '0' + d .getHours() : d.getHours(),
        datestr = hours + ':' + minutes + ':' + seconds,

        line = datestr + ' [' + response.statusCode + ']: ' + request.url;
    let colorized = line;
    if (tty.isatty(process.stdout.fd))
        colorized = (response.statusCode >= 500) ? line.red.bold :
            (response.statusCode >= 400) ? line.red :
                line;
    console.log(colorized);
};

let options;

if (argv.help) {
    require('optimist').showHelp(console.log);
    process.exit(0);
}

if (argv.version) {
    console.log('@brettz9/node-static', statik.version.join('.'));
    process.exit(0);
}

if ('cache' in argv) {
    (options = options || {}).cache = argv.cache;
}

if (argv.headers) {
    (options = options || {}).headers = JSON.parse(argv.headers);
}

if (argv['header-file']) {
    (options = options || {}).headers =
        JSON.parse(fs.readFileSync(argv['header-file']));
}

if (argv.gzip) {
    (options = options || {}).gzip = true;
}

if (argv.indexFile) {
    (options = options || {}).indexFile = argv['indexFile'];
}

const file = new(statik.Server)(dir, options);

require('http').createServer(function (request, response) {
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
        if (argv['spa'] && !url.parse(request.url).pathname.includes(".")) {
            file.serveFile(argv['indexFile'], 200, {}, request, response);
        } else {
            file.serve(request, response, callback);
        }
    }).resume();
}).listen(+argv.port, argv['host-address']);

console.log('serving "' + dir + '" at http://' + argv['host-address'] + ':' + argv.port);
if (argv.spa) {
    console.log('serving as a single page app (all non-file requests redirect to ' + argv['indexFile'] +')');
}
