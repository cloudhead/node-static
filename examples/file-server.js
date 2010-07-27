var sys = require('sys');
var static = require('../lib/node-static');

//
// Create a node-static server instance to serve the './public' folder
//
var file = new(static.Server)();

require('http').createServer(function (request, response) {
    request.addListener('end', function () {
        //
        // Serve files!
        //
        file.serve(request, response, function (status, headers) {
            sys.error("> Error serving " + request.url + " - " + status);
            response.writeHead(status, headers);
            response.end();
        });
    });
}).listen(8080);

sys.puts("> node-static is listening on http://127.0.0.1:8080");
