'use strict';

const statik = require('../lib/node-static');

//
// Create a node-static server to serve the current directory
//
const file = new statik.Server('.', { cache: 7200, headers: {'X-Hello':'World!'} });

require('http').createServer(function (request, response) {
    file.serve(request, response, function (err, res) {
        if (err) { // An error has occurred
            console.error("> Error serving " + request.url + " - " + err.message);
            response.writeHead(err.status, err.headers);
            response.end();
        } else { // The file was served successfully
            console.log("> " + request.url + " - " + res.message);
        }
    });
}).listen(8080);

console.log("> @brettz9/node-static is listening on http://127.0.0.1:8080");
