#!/usr/bin/env node

function help() {
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

var fs = require('fs'),
    tty = require('tty'),
    statik = require('./../lib/node-static');
    neodoc = require('neodoc');

var args = neodoc.run(help(), {
    laxPlacement: true,
    helpFlags: ['-h', '--help']
});

var dir = args['<directory>'] || '.';

var colors = require('colors');

var log = function(request, response, statusCode) {
    var d = new Date();
    var seconds = d.getSeconds() < 10? '0'+d.getSeconds() : d.getSeconds(),
        datestr = d.getHours() + ':' + d.getMinutes() + ':' + seconds,
        line = datestr + ' [' + response.statusCode + ']: ' + request.url,
        colorized = line;
    if (tty.isatty(process.stdout.fd))
        colorized = (response.statusCode >= 500) ? line.red.bold :
                    (response.statusCode >= 400) ? line.red :
                    line;
    console.log(colorized);
};

var file, options = {};

if (args['--version']) {
    console.log('node-static', statik.version.join('.'));
    process.exit(0);
}

if (args['--cache']) {
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

file = new(statik.Server)(dir, options);

require('http').createServer(function (request, response) {
    request.addListener('end', function () {
        var callback = function(e, rsp) {
          if (e && e.status === 404) {
              response.writeHead(e.status, e.headers);
              response.end("Not Found");
              log(request, response);
          } else {
              log(request, response);
          }
        };

        if (args['--spa'] && request.url.indexOf(".") == -1) {
            file.serveFile(args['--index-file'], 200, {}, request, response);
        } else {
            file.serve(request, response, callback);
        }
    }).resume();
}).listen(+args['--port'], args['--host-address']);

console.log('serving "' + dir + '" at http://' + args['--host-address'] + ':' + args['--port']);
if (args['--spa']) {
  console.log('serving as a single page app (all non-file requests redirect to ' + arg['--index-file'] +')');
}
