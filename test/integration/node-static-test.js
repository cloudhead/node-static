'use strict';

const vows    = require('vows')
    , request = require('request')
    , assert  = require('assert')
    , statik  = require('../../lib/node-static');

let fileServer  = new statik.Server(__dirname + '/../fixtures');
const suite       = vows.describe('@brettz9/node-static');
const TEST_PORT   = 8080;
const TEST_SERVER = 'http://localhost:' + TEST_PORT;
const version     = statik.version.join('.');
let server;
let callback;

const headers = {
    'requesting headers': {
        topic : function(){
            request.head(TEST_SERVER + '/index.html', this.callback);
        }
    }
}
headers['requesting headers']['should respond with @brettz9/node-static/' + version] = function(error, response, body){
    assert.equal(response.headers['server'], '@brettz9/node-static/' + version);
}

suite.addBatch({
    'once an http server is listening with a callback': {
        topic: function () {
            server = require('http').createServer(function (request, response) {
                fileServer.serve(request, response, function(err, result) {
                    if (callback)
                        callback(request, response, err, result);
                    else
                        request.end();
                });
            }).listen(TEST_PORT, this.callback)
        },
        'should be listening' : function(){
            /* This test is necessary to ensure the topic execution.
       * A topic without tests will be not executed */
            assert.isTrue(true);
        }
    },
}).addBatch({
    'streaming a 404 page': {
        topic: function(){
            callback = function(request, response, err, result) {
                if (err) {
                    response.writeHead(err.status, err.headers);
                    setTimeout(function() {
                        response.end('Custom 404 Stream.')
                    }, 100);
                }
            }
            request.get(TEST_SERVER + '/not-found', this.callback);
        },
        'should respond with 404' : function(error, response, body){
            assert.equal(response.statusCode, 404);
        },
        'should respond with the streamed content': function(error, response, body){
            callback = null;
            assert.equal(body, 'Custom 404 Stream.');
        }
    }
}).addBatch({
    'once an http server is listening without a callback': {
        topic: function () {
            server.close();
            server = require('http').createServer(function (request, response) {
                fileServer.serve(request, response);
            }).listen(TEST_PORT, this.callback)
        },
        'should be listening' : function(){
            /* This test is necessary to ensure the topic execution.
       * A topic without tests will be not executed */
            assert.isTrue(true);
        }
    }
}).addBatch({
    'requesting a file not found': {
        topic : function(){
            request.get(TEST_SERVER + '/not-found', this.callback);
        },
        'should respond with 404' : function(error, response, body){
            assert.equal(response.statusCode, 404);
        }
    }
}).addBatch({
    'requesting a file not found (file with same initial letters)': {
        topic : function(){
            fileServer  = new statik.Server(__dirname + '/../fixtures/there');
            request.get(TEST_SERVER + '/there.html', this.callback);
        },
        'should respond with 404' : function(error, response, body){
            assert.equal(response.statusCode, 404);
        }
    }
}).addBatch({
    'requesting a file not found (directory with same initial letters)': {
        topic : function(){
            fileServer  = new statik.Server(__dirname + '/../fixtures/there');
            request.get(TEST_SERVER + '/thereat/index.html', this.callback);
        },
        'should respond with 404' : function(error, response, body){
            assert.equal(response.statusCode, 404);
        }
    }
})
    .addBatch({
        'requesting a malformed URI': {
            topic: function(){
                fileServer  = new statik.Server(__dirname + '/../fixtures');
                request.get(TEST_SERVER + '/a%AFc', this.callback);
            },
            'should respond with 400': function(error, response, body){
                assert.equal(response.statusCode, 400);
            }
        }
    })
    .addBatch({
        'serving empty.css': {
            topic : function(){
                request.get(TEST_SERVER + '/empty.css', this.callback);
            },
            'should respond with 200' : function(error, response, body){
                assert.equal(response.statusCode, 200);
            },
            'should respond with text/css': function(error, response, body){
                assert.equal(response.headers['content-type'], 'text/css');
            },
            'should respond with empty string': function(error, response, body){
                assert.equal(body, '');
            }
        }
    })
    .addBatch({
        'serving hello.txt': {
            topic : function(){
                request.get(TEST_SERVER + '/hello.txt', this.callback);
            },
            'should respond with 200' : function(error, response, body){
                assert.equal(response.statusCode, 200);
            },
            'should respond with text/plain': function(error, response, body){
                assert.equal(response.headers['content-type'], 'text/plain');
            },
            'should respond with hello world': function(error, response, body){
                assert.equal(body, 'hello world');
            }
        }
    }).addBatch({
        'serving hello.txt without server header': {
            topic : function(){
                fileServer  = new statik.Server(__dirname + '/../fixtures', {
                    serverInfo: null
                });

                request.get(TEST_SERVER + '/hello.txt', this.callback);
            },
            'should respond with 200' : function(error, response, body){
                assert.equal(response.statusCode, 200);
            },
            'should respond with text/plain': function(error, response, body){
                assert.equal(response.headers['content-type'], 'text/plain');
            },
            'should contain server header': function(error, response, body){
                assert.equal(response.headers['server'], null);
            },
            'should respond with hello world': function(error, response, body){
                assert.equal(body, 'hello world');
            }
        }
    }).addBatch({
        'serving hello.txt with custom server header': {
            topic : function(){
                fileServer  = new statik.Server(__dirname + '/../fixtures', {
                    serverInfo: 'own header'
                });

                request.get(TEST_SERVER + '/hello.txt', this.callback);
            },
            'should respond with 200' : function(error, response, body){
                assert.equal(response.statusCode, 200);
            },
            'should respond with text/plain': function(error, response, body){
                assert.equal(response.headers['content-type'], 'text/plain');
            },
            'should contain custom server header': function(error, response, body){
                assert.equal(response.headers['server'], 'own header');
            },
            'should respond with hello world': function(error, response, body){
                assert.equal(body, 'hello world');
            }
        }
    }).addBatch({
        'serving first 5 bytes of hello.txt': {
            topic : function(){
                fileServer  = new statik.Server(__dirname + '/../fixtures');
                const options = {
                    url: TEST_SERVER + '/hello.txt',
                    headers: {
                        'Range': 'bytes=0-4'
                    }
                };
                request.get(options, this.callback);
            },
            'should respond with 206' : function(error, response, body){
                assert.equal(response.statusCode, 206);
            },
            'should respond with text/plain': function(error, response, body){
                assert.equal(response.headers['content-type'], 'text/plain');
            },
            'should have content-length of 5 bytes': function(error, response, body){
                assert.equal(response.headers['content-length'], 5);
            },
            'should have a valid Content-Range header in response': function(error, response, body){
                assert.equal(response.headers['content-range'], 'bytes 0-4/11');
            },
            'should respond with hello': function(error, response, body){
                assert.equal(body, 'hello');
            }
        }
    }).addBatch({
        'serving last 5 bytes of hello.txt': {
            topic : function(){
                const options = {
                    url: TEST_SERVER + '/hello.txt',
                    headers: {
                        'Range': 'bytes=6-10'
                    }
                };
                request.get(options, this.callback);
            },
            'should respond with 206' : function(error, response, body){
                assert.equal(response.statusCode, 206);
            },
            'should respond with text/plain': function(error, response, body){
                assert.equal(response.headers['content-type'], 'text/plain');
            },
            'should have content-length of 5 bytes': function(error, response, body){
                assert.equal(response.headers['content-length'], 5);
            },
            'should have a valid Content-Range header in response': function(error, response, body){
                assert.equal(response.headers['content-range'], 'bytes 6-10/11');
            },
            'should respond with world': function(error, response, body){
                assert.equal(body, 'world');
            }
        }
    }).addBatch({
        'serving first byte of hello.txt': {
            topic : function(){
                const options = {
                    url: TEST_SERVER + '/hello.txt',
                    headers: {
                        'Range': 'bytes=0-0'
                    }
                };
                request.get(options, this.callback);
            },
            'should respond with 206' : function(error, response, body){
                assert.equal(response.statusCode, 206);
            },
            'should respond with text/plain': function(error, response, body){
                assert.equal(response.headers['content-type'], 'text/plain');
            },
            'should have content-length of 1 bytes': function(error, response, body){
                assert.equal(response.headers['content-length'], 1);
            },
            'should have a valid Content-Range header in response': function(error, response, body){
                assert.equal(response.headers['content-range'], 'bytes 0-0/11');
            },
            'should respond with h': function(error, response, body){
                assert.equal(body, 'h');
            }
        }
    }).addBatch({
        'serving all from the start of hello.txt': {
            topic : function(){
                const options = {
                    url: TEST_SERVER + '/hello.txt',
                    headers: {
                        'Range': 'bytes=0-'
                    }
                };
                request.get(options, this.callback);
            },
            'should respond with 206' : function(error, response, body){
                assert.equal(response.statusCode, 206);
            },
            'should respond with text/plain': function(error, response, body){
                assert.equal(response.headers['content-type'], 'text/plain');
            },
            'should have content-length of 11 bytes': function(error, response, body){
                assert.equal(response.headers['content-length'], 11);
            },
            'should have a valid Content-Range header in response': function(error, response, body){
                assert.equal(response.headers['content-range'], 'bytes 0-10/11');
            },
            'should respond with "hello world"': function(error, response, body){
                assert.equal(body, 'hello world');
            }
        }
    }).addBatch({
        'serving directory index': {
            topic : function(){
                request.get(TEST_SERVER, this.callback);
            },
            'should respond with 200' : function(error, response, body){
                assert.equal(response.statusCode, 200);
            },
            'should respond with text/html': function(error, response, body){
                assert.equal(response.headers['content-type'], 'text/html');
            }
        }
    }).addBatch({
        'serving index.html from the cache': {
            topic : function(){
                request.get(TEST_SERVER + '/index.html', this.callback);
            },
            'should respond with 200' : function(error, response, body){
                assert.equal(response.statusCode, 200);
            },
            'should respond with text/html': function(error, response, body){
                assert.equal(response.headers['content-type'], 'text/html');
            },
            'should respond with cache-control': function(error, response, body){
                assert.equal(response.headers['cache-control'], 'max-age=3600');
            }
        }
    }).addBatch({
        'requesting with If-None-Match': {
            topic : function(){
                const _this = this;
                request.get(TEST_SERVER + '/index.html', function(error, response, body){
                    request({
                        method: 'GET',
                        uri: TEST_SERVER + '/index.html',
                        headers: {'if-none-match': response.headers['etag']}
                    },
                    _this.callback);
                });
            },
            'should respond with 304' : function(error, response, body){
                assert.equal(response.statusCode, 304);
            }
        },
        'requesting with If-None-Match and If-Modified-Since': {
            topic : function(){
                const _this = this;
                request.get(TEST_SERVER + '/index.html', function(error, response, body){
                    const modified = Date.parse(response.headers['last-modified']);
                    const oneDayLater = new Date(modified + (24 * 60 * 60 * 1000)).toUTCString();
                    const nonMatchingEtag = '1111222233334444';
                    request({
                        method: 'GET',
                        uri: TEST_SERVER + '/index.html',
                        headers: {
                            'if-none-match': nonMatchingEtag,
                            'if-modified-since': oneDayLater
                        }
                    },
                    _this.callback);
                });
            },
            'should respond with a 200': function(error, response, body){
                assert.equal(response.statusCode, 200);
            }
        }
    })
    .addBatch({
        'requesting POST': {
            topic : function(){
                request.post(TEST_SERVER + '/index.html', this.callback);
            },
            'should respond with 200' : function(error, response, body){
                assert.equal(response.statusCode, 200);
            },
            'should not be empty' : function(error, response, body){
                assert.isNotEmpty(body);
            }
        }
    })
    .addBatch({
        'requesting HEAD': {
            topic : function(){
                request.head(TEST_SERVER + '/index.html', this.callback);
            },
            'should respond with 200' : function(error, response, body){
                assert.equal(response.statusCode, 200);
            },
            'head must has no body' : function(error, response, body){
                assert.isEmpty(body);
            }
        }
    })
    .addBatch(headers)
    .addBatch({
        'addings custom mime types': {
            topic : function() {
                statik.mime.define({
                    // 'application/font-woff': ['woff'], // Will throw
                    'application/x-special': ['special']
                });
                this.callback();
            },
            'should add special' : function(error, response, body){
                assert.equal(statik.mime.getType('special'), 'application/x-special');
            }
        }
    })
    .addBatch({
        'addings custom mime types (force)': {
            topic : function() {
                const force = true;
                statik.mime.define({
                    'application/font-woff': ['woff'],
                    'application/x-special': ['special']
                }, force);
                this.callback();
            },
            'should add special' : function(error, response, body){
                assert.equal(statik.mime.getType('special'), 'application/x-special');
            },
            'should add woff without overriding built-in mapping' : function(error, response, body){
                assert.equal(statik.mime.getType('woff'), 'application/font-woff');
            }
        }
    })
    .addBatch({
        'serving subdirectory index': {
            topic : function(){
                request.get(TEST_SERVER + '/there/', this.callback); // with trailing slash
            },
            'should respond with 200' : function(error, response, body){
                assert.equal(response.statusCode, 200);
            },
            'should respond with text/html': function(error, response, body){
                assert.equal(response.headers['content-type'], 'text/html');
            }
        }
    })
    .addBatch({
        'redirecting to subdirectory index': {
            topic : function(){
                request.get({ url: TEST_SERVER + '/there', followRedirect: false }, this.callback); // without trailing slash
            },
            'should respond with 301' : function(error, response, body){
                assert.equal(response.statusCode, 301);
            },
            'should respond with location header': function(error, response, body){
                assert.equal(response.headers['location'], '/there/'); // now with trailing slash
            },
            'should respond with empty string body' : function(error, response, body){
                assert.equal(body, '');
            }
        }
    })
    .addBatch({
        'requesting a subdirectory (with trailing slash) not found': {
            topic : function(){
                request.get(TEST_SERVER + '/notthere/', this.callback); // with trailing slash
            },
            'should respond with 404' : function(error, response, body){
                assert.equal(response.statusCode, 404);
            }
        }
    })
    .addBatch({
        'requesting a subdirectory (without trailing slash) not found': {
            topic : function(){
                request.get({ url: TEST_SERVER + '/notthere', followRedirect: false }, this.callback); // without trailing slash
            },
            'should respond with 404' : function(error, response, body){
                assert.equal(response.statusCode, 404);
            }
        }
    }).addBatch({
        'once an http server is listening with custom index configuration': {
            topic: function () {
                server.close();

                fileServer  = new statik.Server(__dirname + '/../fixtures', { indexFile: "hello.txt" });

                server = require('http').createServer(function (request, response) {
                    fileServer.serve(request, response);
                }).listen(TEST_PORT, this.callback)
            },
            'should be listening' : function(){
                /* This test is necessary to ensure the topic execution.
       * A topic without tests will be not executed */
                assert.isTrue(true);
            }
        }
    }).addBatch({
        'serving custom index file': {
            topic : function(){
                request.get(TEST_SERVER + '/', this.callback);
            },
            'should respond with 200' : function(error, response, body){
                assert.equal(response.statusCode, 200);
            },
            'should respond with empty string': function(error, response, body){
                assert.equal(body, 'hello world');
            }
        }
    }).addBatch({
        'handling malicious urls': {
            topic : function(){
                request.get(TEST_SERVER + '/%00', this.callback);
            },
            'should respond with 404' : function(error, response, body){
                assert.equal(response.statusCode, 404);
            }
        }
    }).addBatch({
        'serving custom index file': {
            topic : function(){
                request.get(TEST_SERVER + '/', this.callback);
            },
            'should respond with 200' : function(error, response, body){
                assert.equal(response.statusCode, 200);
            },
            'should respond with empty string': function(error, response, body){
                assert.equal(body, 'hello world');
            }
        }
    }).addBatch({
        'finding a file by default extension': {
            topic: function() {
                server.close();

                fileServer = new statik.Server(__dirname+'/../fixtures', {defaultExtension: "txt"});

                server = require('http').createServer(function(request, response) {
                    fileServer.serve(request, response);
                }).listen(TEST_PORT);
                request.get(TEST_SERVER + '/hello', this.callback);
            },
            'should respond with 200': function(error, response, body) {
                assert.equal(response.statusCode, 200);
            },
            'should respond with text/plain': function(error, response, body) {
                assert.equal(response.headers['content-type'], 'text/plain');
            },
            'should respond with hello world': function(error, response, body) {
                assert.equal(body, 'hello world');
            }
        }
    }).addBatch({
        'default extension does not interfere with folders': {
            topic : function(){
                server.close();

                fileServer = new statik.Server(__dirname+'/../fixtures', {defaultExtension: "html"});

                server = require('http').createServer(function(request, response) {
                    fileServer.serve(request, response);
                }).listen(TEST_PORT);
                request.get({ url: TEST_SERVER + '/there', followRedirect: false }, this.callback); // without trailing slash
            },
            'should respond with 301' : function(error, response, body){
                assert.equal(response.statusCode, 301);
            },
            'should respond with location header': function(error, response, body){
                assert.equal(response.headers['location'], '/there/'); // now with trailing slash
            },
            'should respond with empty string body' : function(error, response, body){
                assert.equal(body, '');
            }
        }
    }).addBatch({
        'once an http server is listening with custom cache configuration': {
            topic: function () {
                server.close();

                fileServer  = new statik.Server(__dirname + '/../fixtures', {
                    cache: {
                        '**/*.txt': 100,
                        '**/': 300
                    }
                });

                server = require('http').createServer(function (request, response) {
                    fileServer.serve(request, response);
                }).listen(TEST_PORT, this.callback)
            },
            'should be listening' : function(){
                /* This test is necessary to ensure the topic execution.
       * A topic without tests will be not executed */
                assert.isTrue(true);
            }
        }
    }).addBatch({
        'requesting custom cache index file': {
            topic : function(){
                request.get(TEST_SERVER + '/', this.callback);
            },
            'should respond with 200' : function(error, response, body){
                assert.equal(response.statusCode, 200);
            },
            'should respond with cache-control': function(error, response, body){
                assert.equal(response.headers['cache-control'], 'max-age=300');
            }
        }
    }).addBatch({
        'requesting custom cache text file': {
            topic : function(){
                request.get(TEST_SERVER + '/hello.txt', this.callback);
            },
            'should respond with 200' : function(error, response, body){
                assert.equal(response.statusCode, 200);
            },
            'should respond with cache-control': function(error, response, body){
                assert.equal(response.headers['cache-control'], 'max-age=100');
            }
        }
    }).addBatch({
        'requesting custom cache un-cached file': {
            topic : function(){
                request.get(TEST_SERVER + '/empty.css', this.callback);
            },
            'should respond with 200' : function(error, response, body){
                assert.equal(response.statusCode, 200);
            },
            'should not respond with cache-control': function(error, response, body){
                assert.equal(response.headers['cache-control'], undefined);
            }
        }
    }).addBatch({
        'terminate server': {
            topic: function() {
                server.close(this.callback);
            },
            'should be listening': function() {
                /* This test is necessary to ensure the topic execution.
           * A topic without tests will be not executed */
                assert.isTrue(true);
            }
        }
    }).export(module);
