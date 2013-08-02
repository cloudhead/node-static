#!/usr/bin/env node

var fs = require('fs'),
    path = require('path'),
    tty = require('tty'),
    express = require('express'),
    statik = require('./../lib/node-static');

    var argv = require('optimist')
        .usage([
            'USAGE: $0 [-p <port>] [<directory>]',
            'simple, rfc 2616 compliant file streaming module for node']
            .join('\n\n'))
        .option('port', {
            alias: 'p',
            'default': 8080,
            description: 'TCP port at which the files will be served'
        })
        .option('cache', {
            alias: 'c',
            description: '"Cache-Control" header setting, defaults to 3600'
        })
        .option('version', {
            alias: 'v',
            description: 'node-static version'
        })
        .option('headers', {
            alias: 'H',
            description: 'additional headers (in JSON format)'
        })
        .option('header-file', {
            alias: 'f',
            description: 'JSON file of additional headers'
        })
        .option('query-filename', {
            alias: 'q',
            description: 'Use the entire query param as the filename'
        })
        .option('help', {
            alias: 'h',
            description: 'display this help message'
        })
        .argv;

    var dir = argv._[0] || '.';

    var trainwreck = fs.readFileSync(path.join(__dirname, '../etc/trainwreck.jpg')),
				notFound = fs.readFileSync(path.join(__dirname, '../etc/404.html'))
        .toString()
        .replace('{{trainwreck}}', trainwreck.toString('base64'));

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

    var file, options;

if (argv.help){
    require('optimist').showHelp(console.log);
    process.exit(0);
}

if (argv.version){
    console.log('node-static', statik.version.join('.'));
    process.exit(0);
}

if (argv.cache){
    (options = options || {}).cache = argv.cache;
}

if (argv.headers){
    (options = options || {}).headers = JSON.parse(argv.headers);
}

if (argv['header-file']){
    (options = options || {}).headers =
        JSON.parse(fs.readFileSync(argv['header-file']));
}

file = new(statik.Server)(dir, options);

app = express();

app.get("*", function(request, response) {
    if (argv.q) {
      file.serveFile(request.url, 200, {}, request, response).on('error', function (e) {
          response.writeHead(404, e.headers);
          response.end(notFound);
          log(request, response);
      }).on('success', function (e) {
          log(request, response);
      });
    } else {
      file.serve(request, response, function(e, rsp) {
          if (e && e.status === 404) {
              response.writeHead(e.status, e.headers);
              response.end(notFound);
              log(request, response);
          } else {
              log(request, response);
          }
      });
    }
})

app.listen(argv.port);
console.log('serving "' + dir + '" at http://127.0.0.1:' + argv.port);

