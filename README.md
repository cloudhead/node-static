node-static
===========

> a simple, *rfc 2616 compliant* file streaming module for [node](http://nodejs.org)

node-static understands and supports *conditional GET* and *HEAD* requests.
node-static was inspired by some of the other static-file serving modules out there,
such as node-paperboy and antinode.

synopsis
--------

    var static = require('node-static');

    //
    // Create a node-static server instance to serve the './public' folder
    //
    var file = new(static.Server)('./public');

    require('http').createServer(function (request, response) {
        request.addListener('end', function () {
            //
            // Serve files!
            //
            file.serve(request, response);
        });
    }).listen(8080);

API
---

Creating a file server instance is as simple as:

    new static.Server();

This will serve files in the current directory. If you want to serve files in a specific
directory, pass it as the first argument:

    new static.Server('./public');

You can also specify how long the client is supposed to cache the files node-static serves:

    new static.Server('./public', { cache: 3600 });

This will set the `Cache-Control` header, telling clients to cache the file for an hour.
This is the default setting.

To serve files, simply call the `serve` method on a `Server` instance, passing it
the HTTP request and response object:

    var fileServer = new static.Server('./public');

    require('http').createServer(function (request, response) {
        request.addListener('end', function () {
            fileServer.serve(request, response);
        });
    }).listen(8080);

An optional callback can be passed as last argument, it will be called if there is
an error serving the file:

    var fileServer = new static.Server('./public');

    require('http').createServer(function (request, response) {
        request.addListener('end', function () {
            fileServer.serve(request, response, function (status, headers) {
                sys.error("Error serving " + request.url + " - " + status);

                response.writeHead(status, headers);
                response.end();
            });
        });
    }).listen(8080);


