#!/usr/bin/env node

/*
 * node-static [options] [root]
 *
 * All --?? options are just packed and passed to node-static/Server.
 * Otherwise options are considered as root directory.
 *
 * ## remaks
 *
 * * '--port' option passed to listen
 * * '--port' and '--cache' options are filtered with parseInt
 */

var static = require('../lib/node-static'),
    options = parseArgs(process.argv.slice(2)),
    file = new (static.Server)(options.root, options);

require('http').createServer(function (request, response) {
    request.addListener('end', function () {
        //
        // Serve files!
        //
        file.serve(request, response, function (err, res) {
            if (err) { // An error as occured
                console.error("> Error serving " + request.url + " - " + err.message);
                response.writeHead(err.status, err.headers);
                response.end();
            } else { // The file was served successfully
                console.log("> " + request.url + " - " + res.message);
            }
        });
    });
}).listen(options.port);

console.log("> node-static is listening on http://127.0.0.1:" + options.port);

function parseArgs(args) {
    var options = {port: 8080};

    for (var i = 0; i < args.length;) {
        if (args[i].substr(0, 2) === '--') {
            options[args[i].substr(2)] = args[i + 1];
            i += 2;
        } else {
            options.root = args[i];
            ++i;
        }
    }

    ['port', 'cache'].forEach(function(toBeInt) {
        if ((toBeInt in options) && typeof options[toBeInt] === 'string') {
            options[toBeInt] = parseInt(options[toBeInt], 10);
        }
    });

    return options;
}

