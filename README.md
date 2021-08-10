# @brettz9/node-static

> a simple, *rfc 2616 compliant* file streaming module for [node](http://nodejs.org)

A maintained fork of `node-static`. `node-static` was inspired by some of the
other static-file serving modules out there, such as node-paperboy and antinode.

`@brettz9/node-static` understands and supports *conditional GET* and *HEAD* requests.

# Synopsis

```js
const statik = require('@brettz9/node-static');

//
// Create a @brettz9/node-static server instance to serve the './public' folder
//
var file = new statik.Server('./public');

require('http').createServer(function (request, response) {
    request.addListener('end', function () {
        //
        // Serve files!
        //
        file.serve(request, response);
    }).resume();
}).listen(8080);
```

API
---

### Creating a @brettz9/node-static Server #

Creating a file server instance is as simple as:

```js
new statik.Server();
```

This will serve files in the current directory. If you want to serve files in a specific
directory, pass it as the first argument:

```js
new statik.Server('./public');
```

You can also specify how long the client is supposed to cache the files
@brettz9/node-static serves:

```js
new statik.Server('./public', { cache: 3600 });
```

This will set the `Cache-Control` header, telling clients to cache the file for an hour.
This is the default setting.

### Serving files under a directory #

To serve files under a directory, simply call the `serve` method on a `Server` instance, passing it
the HTTP request and response object:

```js
var statik = require('@brettz9/node-static');

var fileServer = new statik.Server('./public');

require('http').createServer(function (request, response) {
    request.addListener('end', function () {
        fileServer.serve(request, response);
    }).resume();
}).listen(8080);
```

### Serving specific files #

If you want to serve a specific file, like an error page for example, use the `serveFile` method:

```js
fileServer.serveFile('/error.html', 500, {}, request, response);
```

This will serve the `error.html` file, from under the file root directory, with a `500` status code.
For example, you could serve an error page, when the initial request wasn't found:

```js
require('http').createServer(function (request, response) {
    request.addListener('end', function () {
        fileServer.serve(request, response, function (e, res) {
            if (e && (e.status === 404)) { // If the file wasn't found
                fileServer.serveFile('/not-found.html', 404, {}, request, response);
            }
        });
    }).resume();
}).listen(8080);
```

More on intercepting errors bellow.

### Intercepting errors & Listening #

An optional callback can be passed as last argument, it will be called every time a file
has been served successfully, or if there was an error serving the file:

```js
var statik = require('@brettz9/node-static');

var fileServer = new statik.Server('./public');

require('http').createServer(function (request, response) {
    request.addListener('end', function () {
        fileServer.serve(request, response, function (err, result) {
            if (err) { // There was an error serving the file
                console.error("Error serving " + request.url + " - " + err.message);

                // Respond to the client
                response.writeHead(err.status, err.headers);
                response.end();
            }
        });
    }).resume();
}).listen(8080);
```

Note that if you pass a callback, and there is an error serving the file,
@brettz9/node-static *will not* respond to the client. This gives you the
opportunity to re-route the request,
or handle it differently.

For example, you may want to interpret a request as a static request, but if
the file isn't found, send it to an application.

If you only want to *listen* for errors, you can use *event listeners*:

```js
fileServer.serve(request, response).addListener('error', function (err) {
    console.error("Error serving " + request.url + " - " + err.message);
});
```

With this method, you don't have to explicitly send the response back, in case of an error.

### Options when creating an instance of `Server` #

#### `cache` #

Sets the `Cache-Control` header.

example: `{ cache: 7200 }` will set the max-age for all files to 7200 seconds
example: `{ cache: {'**/*.css': 300}}` will set the max-age for all CSS files to 5 minutes.

Passing a number will set the cache duration to that number of seconds.
Passing `false` will disable the `Cache-Control` header.
Passing a object with [minimatch glob pattern](https://github.com/isaacs/minimatch) keys and number values will set cache max-age for any matching paths.

> Defaults to `3600`


#### `serverInfo` #

Sets the `Server` header.

example: `{ serverInfo: "myserver" }`

> Defaults to `@brettz9/node-static/{version}`

#### `headers` #

Sets response headers.

example: `{ headers: { 'X-Hello': 'World!' } }`

> defaults to `{}`

#### `gzip` #

Enable support for sending compressed responses.  This will enable a check for a
file with the same name plus '.gz' in the same folder.  If the compressed file is
found and the client has indicated support for gzip file transfer, the contents
of the .gz file will be sent in place of the uncompressed file along with a
Content-Encoding: gzip header to inform the client the data has been compressed.

example: `{ gzip: true }`
example: `{ gzip: /^\/text/ }`

Passing `true` will enable this check for all files.
Passing a RegExp instance will only enable this check if the content-type of the
respond would match that RegExp using its test() method.

> Defaults to `false`

#### `indexFile` #

Choose a custom index file when serving up directories.

example: `{ indexFile: "index.htm" }`

> Defaults to `index.html`

#### `defaultExtension` #

Choose a default extension when serving files.
A request to '/myFile' would check for a `myFile` folder (first) then a `myFile.html` (second).

example: `{ defaultExtension: "html" }`

> Defaults to `null`


Command Line Interface
----------------------

`@brettz9/node-static` also provides a CLI.

### Installation #

```sh
$ npm install -g @brettz9/node-static
```

### Example Usage #

```sh
# serve up the current directory
$ static
serving "." at http://127.0.0.1:8080

# serve up a different directory
$ static public
serving "public" at http://127.0.0.1:8080

# specify additional headers (this one is useful for development)
$ static -H '{"Cache-Control": "no-cache, must-revalidate"}'
serving "." at http://127.0.0.1:8080

# set cache control max age
$ static -c 7200
serving "." at http://127.0.0.1:8080

# expose the server to your local network
$ static -a 0.0.0.0
serving "." at http://0.0.0.0:8080

# show help message, including all options
$ static -h
```
