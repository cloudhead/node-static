import got from 'got';
import assert from 'assert';
import statik from '../../lib/node-static.js';

let fileServer  = new statik.Server(__dirname + '/../fixtures');

const TEST_PORT   = 8080;
const TEST_SERVER = 'http://localhost:' + TEST_PORT;
const version     = statik.version.join('.');

function startStaticServer (callback) {
    return new Promise((resolve, reject) => {
        const server = require('http').createServer(function (request, response) {
            fileServer.serve(request, response);
        });
        server.listen(TEST_PORT, () => {
            resolve(server);
        });
    });
}

function startStaticServerWithCallback (callback) {
    return new Promise((resolve, reject) => {
        require('http').createServer((request, response) => {
            fileServer.serve(request, response, (err, result) => {
                if (callback) {
                    callback(request, response, err, result);
                } else {
                    request.end();
                }
            });
        }).listen(TEST_PORT, () => {
            resolve();
        });
    });
}

describe('node-static', function () {
    it('streaming a 404 page', async function () {
        const server = await startStaticServerWithCallback((request, response, err, result) => {
            if (err) {
                response.writeHead(err.status, err.headers);
                setTimeout(() => {
                    response.end('Custom 404 Stream.')
                }, 100);
            }
        });
        const response = await got(TEST_SERVER + '/not-found');

        assert.equal(response.headers[':status'], 404, 'should respond with 404');

        assert.equal(
            await response.text(),
            'Custom 404 Stream.',
            'should respond with the streamed content'
        );

        server.close();
    });

    describe('once an http server is listening without a callback', function () {
        it('requesting a file not found', async function () {
            const server = await startStaticServer();

            const response = await got(TEST_SERVER + '/not-found');

            assert.equal(response.headers[':status'], 404, 'should respond with 404');
        });
        it('requesting a file not found (file with same initial letters)', async function () {
            fileServer = new statik.Server(__dirname + '/../fixtures/there');
            const response = await got(TEST_SERVER + '/there.html');
            assert.equal(response.headers[':status'], 404, 'should respond with 404');
        })
        it('requesting a file not found (directory with same initial letters)', async function () {
            fileServer  = new statik.Server(__dirname + '/../fixtures/there');
            const response = await got(TEST_SERVER + '/thereat/index.html');
            assert.equal(response.headers[':status'], 404, 'should respond with 404');
        });
        it('requesting a malformed URI', async function () {
            fileServer  = new statik.Server(__dirname + '/../fixtures');
            const response = await got(TEST_SERVER + '/a%AFc');
            assert.equal(response.headers[':status'], 400, 'should respond with 400');
        });

        it('serving empty.css', async function () {
            const response = await got(TEST_SERVER + '/empty.css');

            assert.equal(response.headers[':status'], 200, 'should respond with 200');

            assert.equal(response.headers['content-type'], 'text/css', 'should respond with text/css');

            assert.equal(await response.text(), '', 'should respond with empty string');
        });

        it('serving hello.txt', async function () {
            const response = await got(TEST_SERVER + '/hello.txt');
            assert.equal(response.headers[':status'], 200, 'should respond with 200');
            assert.equal(response.headers['content-type'], 'text/plain', 'should respond with text/plain');
            assert.equal(await response.text(), 'hello world', 'should respond with hello world');
        });

        it('serving hello.txt without server header', async function (){
            fileServer = new statik.Server(__dirname + '/../fixtures', {
                serverInfo: null
            });

            const response = await got(TEST_SERVER + '/hello.txt');
            assert.equal(response.headers[':status'], 200, 'should respond with 200');
            assert.equal(response.headers['content-type'], 'text/plain', 'should respond with text/plain');

            assert.equal(response.headers['server'], null, 'should contain server header');

            assert.equal(await response.text(), 'hello world', 'should respond with hello world');
        });
        it('serving hello.txt with custom server header', async function () {
            fileServer  = new statik.Server(__dirname + '/../fixtures', {
                serverInfo: 'own header'
            });

            const response = await got(TEST_SERVER + '/hello.txt');
            assert.equal(response.headers[':status'], 200, 'should respond with 200');
            assert.equal(response.headers['content-type'], 'text/plain', 'should respond with text/plain');
            assert.equal(response.headers['server'], 'own header', 'should contain custom server header');
            assert.equal(await response.text(), 'hello world', 'should respond with hello world');
        });
        it('serving first 5 bytes of hello.txt', async function () {
            fileServer = new statik.Server(__dirname + '/../fixtures');
            const options = {
                url: TEST_SERVER + '/hello.txt',
                headers: {
                    'Range': 'bytes=0-4'
                }
            };
            const response = await got(options);

            assert.equal(response.headers[':status'], 206, 'should respond with 206');
            assert.equal(response.headers['content-type'], 'text/plain', 'should respond with text/plain');
            assert.equal(response.headers['content-length'], 5, 'should have content-length of 5 bytes');

            assert.equal(response.headers['content-range'], 'bytes 0-4/11', 'should have a valid Content-Range header in response');
            assert.equal(await response.text(), 'hello', 'should respond with hello');
        });
        it('serving last 5 bytes of hello.txt', async function () {
            const options = {
                url: TEST_SERVER + '/hello.txt',
                headers: {
                    'Range': 'bytes=6-10'
                }
            };
            const response = await got(options);
            assert.equal(response.headers[':status'], 206, 'should respond with 206');
            assert.equal(response.headers['content-type'], 'text/plain', 'should respond with text/plain');
            assert.equal(response.headers['content-length'], 5, 'should have content-length of 5 bytes');
            assert.equal(response.headers['content-range'], 'bytes 6-10/11', 'should have a valid Content-Range header in response');
            assert.equal(await response.text(), 'world', 'should respond with world');
        });
        it('serving first byte of hello.txt', async function (){
            const options = {
                url: TEST_SERVER + '/hello.txt',
                headers: {
                    'Range': 'bytes=0-0'
                }
            };
            const response = await got(options);
            assert.equal(response.headers[':status'], 206, 'should respond with 206');
            assert.equal(response.headers['content-type'], 'text/plain', 'should respond with text/plain');
            assert.equal(response.headers['content-length'], 1, 'should have content-length of 1 bytes');
            assert.equal(response.headers['content-range'], 'bytes 0-0/11', 'should have a valid Content-Range header in response');
            assert.equal(await response.text(), 'h', 'should respond with h');
        });
        it('serving all from the start of hello.txt', async function () {
            const options = {
                url: TEST_SERVER + '/hello.txt',
                headers: {
                    'Range': 'bytes=0-'
                }
            };
            const response = await got(options);
            assert.equal(response.headers[':status'], 206, 'should respond with 206');
            assert.equal(response.headers['content-type'], 'text/plain', 'should respond with text/plain');
            assert.equal(response.headers['content-length'], 11, 'should have content-length of 11 bytes');
            assert.equal(response.headers['content-range'], 'bytes 0-10/11', 'should have a valid Content-Range header in response');
            assert.equal(await response.text(), 'hello world', 'should respond with "hello world"');
        });
        it('serving directory index', async function (){
            const response = await got(TEST_SERVER);
            assert.equal(response.headers[':status'], 200, 'should respond with 200');
            assert.equal(response.headers['content-type'], 'text/html', 'should respond with text/html');
        });
        it('serving index.html from the cache', async function () {
            const response = await got(TEST_SERVER + '/index.html');

            assert.equal(response.headers[':status'], 200, 'should respond with 200');
            assert.equal(response.headers['content-type'], 'text/html', 'should respond with text/html');
            assert.equal(response.headers['cache-control'], 'max-age=3600', 'should respond with cache-control');
        });
        it('requesting with If-None-Match', async function () {
            let response = await got(TEST_SERVER + '/index.html');
            response = await got({
                uri: TEST_SERVER + '/index.html',
                headers: {'if-none-match': response.headers['etag']}
            });

            assert.equal(response.headers[':status'], 304, 'should respond with 304');
        })
        it('requesting with If-None-Match and If-Modified-Since', async function () {
            const response = await got(TEST_SERVER + '/index.html');
            const modified = Date.parse(response.headers['last-modified']);
            const oneDayLater = new Date(modified + (24 * 60 * 60 * 1000)).toUTCString();
            const nonMatchingEtag = '1111222233334444';
            await got({
                uri: TEST_SERVER + '/index.html',
                headers: {
                    'if-none-match': nonMatchingEtag,
                    'if-modified-since': oneDayLater
                }
            });
            assert.equal(response.headers[':status'], 200, 'should respond with a 200');
        });
        it('requesting POST', async function (){
            const response = await got.post(TEST_SERVER + '/index.html');
            assert.equal(response.headers[':status'], 200, 'should respond with 200');
            assert.isNotEmpty(await response.text(), 'should not be empty');
        });

        it('requesting HEAD', async function () {
            const response = await got.head(TEST_SERVER + '/index.html');
            assert.equal(response.headers[':status'], 200, 'should respond with 200');
            assert.isEmpty(await response.text(), 'head must has no body');
        });
    })
    it('requesting headers', async function () {
        const response = await got.head(TEST_SERVER + '/index.html');
        assert.equal(response.headers['server'], 'node-static/' + version, 'should respond with node-static/' + version);
    });
    it('addings custom mime types', async function () {
        statik.mime.define({
            // 'application/font-woff': ['woff'], // Will throw
            'application/x-special': ['special']
        });
        assert.equal(statik.mime.getType('special'), 'application/x-special', 'should add special');
    });
    it('addings custom mime types (force)', async function () {
        const force = true;
        statik.mime.define({
            'application/font-woff': ['woff'],
            'application/x-special': ['special']
        }, force);
        assert.equal(statik.mime.getType('special'), 'application/x-special', 'should add special');
        assert.equal(statik.mime.getType('woff'), 'application/font-woff', 'should add woff without overriding built-in mapping');
    });
    it('serving subdirectory index', async function () {
        const response = await got(TEST_SERVER + '/there/'); // with trailing slash
        assert.equal(response.headers[':status'], 200, 'should respond with 200');
        assert.equal(response.headers['content-type'], 'text/html', 'should respond with text/html');
    });
    it('serving subdirectory embedding website name (should not redirect)', async function () {
        const response = await got({
            url: TEST_SERVER + '//example.com',
            followRedirect: false
        }); // without trailing slash
        assert.equal(response.headers[':status'], 200, 'should respond with 200');
        assert.equal(response.headers['content-type'], 'text/html', 'should respond with text/html');
    })
    it('redirecting to subdirectory index', async function () {
        const response = await got({
            url: TEST_SERVER + '/there',
            followRedirect: false
        }); // without trailing slash
        assert.equal(response.headers[':status'], 301, 'should respond with 301');
        assert.equal(response.headers['location'], '/there/', 'should respond with location header'); // now with trailing slash
        assert.equal(await response.text(), '', 'should respond with empty string body');
    });
    it('requesting a subdirectory (with trailing slash) not found', async function () {
        const response = await got(TEST_SERVER + '/notthere/'); // with trailing slash
        assert.equal(response.headers[':status'], 404, 'should respond with 404');
    });
    it('requesting a subdirectory (without trailing slash) not found', async function () {
        const response = await got({ url: TEST_SERVER + '/notthere', followRedirect: false }); // without trailing slash
        assert.equal(response.headers[':status'], 404, 'should respond with 404');
    });
    describe('once an http server is listening with custom index configuration', function () {
        server.close();

        fileServer  = new statik.Server(__dirname + '/../fixtures', { indexFile: "hello.txt" });

        server = require('http').createServer(function (request, response) {
            fileServer.serve(request, response);
        }).listen(TEST_PORT, this.callback)

        it('serving custom index file', async function () {
            const response = await got(TEST_SERVER + '/');
            assert.equal(response.headers[':status'], 200, 'should respond with 200');
            assert.equal(await response.text(), 'hello world', 'should respond with empty string');
        });

        it('handling malicious urls', async function () {
            const response = await got(TEST_SERVER + '/%00');
            assert.equal(response.headers[':status'], 404, 'should respond with 404');
        });

        it('serving custom index file', async function () {
            const response = await got(TEST_SERVER + '/');
            assert.equal(response.headers[':status'], 200, 'should respond with 200');
            assert.equal(await response.text(), 'hello world', 'should respond with empty string');
        });

        it('finding a file by default extension', async function() {
            server.close();

            fileServer = new statik.Server(__dirname+'/../fixtures', {defaultExtension: "txt"});

            server = require('http').createServer(function(request, response) {
                fileServer.serve(request, response);
            }).listen(TEST_PORT);
            const response = await got(TEST_SERVER + '/hello');

            assert.equal(response.headers[':status'], 200, 'should respond with 200');
            assert.equal(response.headers['content-type'], 'text/plain', 'should respond with text/plain');
            assert.equal(await response.text(), 'hello world', 'should respond with hello world');
        });
        it('default extension does not interfere with folders', async function () {
            server.close();

            fileServer = new statik.Server(__dirname+'/../fixtures', {defaultExtension: "html"});

            server = require('http').createServer(function(request, response) {
                fileServer.serve(request, response);
            }).listen(TEST_PORT);
            const response = await got({ url: TEST_SERVER + '/there', followRedirect: false }); // without trailing slash

            assert.equal(response.headers[':status'], 301, 'should respond with 301');
            assert.equal(response.headers['location'], '/there/', 'should respond with location header'); // now with trailing slash
            assert.equal(await response.text(), '', 'should respond with empty string body');
        });
        describe('once an http server is listening with custom cache configuration', function () {
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
            it('requesting custom cache index file', async function () {
                const response = await got(TEST_SERVER + '/');
                assert.equal(response.headers[':status'], 200, 'should respond with 200');
                assert.equal(response.headers['cache-control'], 'max-age=300', 'should respond with cache-control');
            });
            it('requesting custom cache text file', async function () {
                const response = await got(TEST_SERVER + '/hello.txt');

                assert.equal(response.headers[':status'], 200, 'should respond with 200');
                assert.equal(response.headers['cache-control'], 'max-age=100', 'should respond with cache-control');
            });
        });
        it('requesting custom cache un-cached file', async function () {
            const response = await got(TEST_SERVER + '/empty.css');
            assert.equal(response.headers[':status'], 200, 'should respond with 200');
            assert.equal(response.headers['cache-control'], undefined, 'should not respond with cache-control');
        });
    });
});
