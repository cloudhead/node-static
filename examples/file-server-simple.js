
var http = require('http');
var static = require('../lib/node-static');


//
// Create a http server
//

var httpd = http.createServer();

//
// Create a node-static server to serve the current directory
//
var file = new static.Server('.');

file.listen(httpd);

httpd.listen(8080);

console.log("> node-static is listening on http://127.0.0.1:8080");
