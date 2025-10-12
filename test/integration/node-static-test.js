import http from 'http';

import {assert} from 'chai';
import fetch from 'node-fetch';
import * as statik from '../../lib/node-static.js';

const __dirname = import.meta.dirname;

let testPort = 8151;

async function setupStaticServer (obj) {
    obj.port = ++testPort;
    obj.server = await startStaticServer(obj.port);
    obj.getTestServer = () => {
        return 'http://localhost:' + obj.port;
    };
}
const version = statik.version.join('.');

let fileServer = new statik.Server(__dirname + '/../fixtures');

function startStaticServer (port) {
    return new Promise((resolve, reject) => {
        const server = http.createServer(function (request, response) {
            fileServer.serve(request, response);
        });
        server.listen(port, () => {
            resolve(server);
        });
    });
}

function startStaticServerWithCallback (port, callback) {
    return new Promise((resolve, reject) => {
        const server = http.createServer((request, response) => {
            fileServer.serve(request, response, (err, result) => {
                callback(request, response, err, result);
            });
        }).listen(port, () => {
            resolve(server);
        });
    });
}

describe('node-static', function () {

    it('handles stream error', function (done) {
        let setError = null;
        const server = http.createServer(function (request, response) {
            fileServer.stream(
                undefined, ['bad-file.txt'], 0, 0, response, (err) => {
                    if (err) {
                        setError = err;
                    }
                }
            );
        });
        server.listen('8081', async () => {
            const response = await fetch('http://localhost:8081');
            assert.equal(response.status, 200, 'should respond with 200');
            assert.equal(await response.text(), '', 'should respond with empty string');
            assert.equal(setError?.code, 'ENOENT');
            server.close();
            done();
        });
    });
    it('streaming a 404 page', async function () {
        testPort++;
        const getTestServer = () => {
            return 'http://localhost:' + testPort;
        };
        const server = await startStaticServerWithCallback(testPort, (request, response, err, result) => {
            if (err) {
                response.writeHead(err.status, err.headers);
                setTimeout(() => {
                    response.end('Custom 404 Stream.')
                }, 100);
            }
        });
        const response = await fetch(getTestServer() + '/not-found');

        assert.equal(response.status, 404, 'should respond with 404');

        assert.equal(
            await response.text(),
            'Custom 404 Stream.',
            'should respond with the streamed content'
        );

        server.close();
    });

    describe('once an http server is listening without a callback', function () {
        beforeEach(async function () {
            await setupStaticServer(this);
        });
        afterEach(async function () {
            this.server.close();
        });
        it('requesting a file not found', async function () {
            const response = await fetch(this.getTestServer() + '/not-found');

            assert.equal(response.status, 404, 'should respond with 404');
        });
        it('requesting a file not found (file with same initial letters)', async function () {
            fileServer = new statik.Server(__dirname + '/../fixtures/there');
            const response = await fetch(this.getTestServer() + '/there.html');
            assert.equal(response.status, 404, 'should respond with 404');
        })
        it('requesting a file not found (directory with same initial letters)', async function () {
            fileServer  = new statik.Server(__dirname + '/../fixtures/there');
            const response = await fetch(this.getTestServer() + '/thereat/index.html');
            assert.equal(response.status, 404, 'should respond with 404');
        });
        it('requesting a malformed URI', async function () {
            fileServer  = new statik.Server(__dirname + '/../fixtures');
            const response = await fetch(this.getTestServer() + '/a%AFc');
            assert.equal(response.status, 400, 'should respond with 400');
        });

        it('serving empty.css', async function () {
            const response = await fetch(this.getTestServer() + '/empty.css');
            assert.equal(response.status, 200, 'should respond with 200');

            assert.equal(response.headers.get('content-type'), 'text/css', 'should respond with text/css');

            assert.equal(await response.text(), '', 'should respond with empty string');
        });

        it('serving hello.txt', async function () {
            const response = await fetch(this.getTestServer() + '/hello.txt');
            assert.equal(response.status, 200, 'should respond with 200');
            assert.equal(response.headers.get('content-type'), 'text/plain', 'should respond with text/plain');
            assert.equal(await response.text(), 'hello world', 'should respond with hello world');
        });

        it('serving hello.txt without server header', async function (){
            fileServer = new statik.Server(__dirname + '/../fixtures', {
                serverInfo: null
            });

            const response = await fetch(this.getTestServer() + '/hello.txt');
            assert.equal(response.status, 200, 'should respond with 200');
            assert.equal(response.headers.get('content-type'), 'text/plain', 'should respond with text/plain');

            assert.equal(response.headers.get('server'), null, 'should contain server header');

            assert.equal(await response.text(), 'hello world', 'should respond with hello world');
        });
        it('serving hello.txt with custom server header', async function () {
            fileServer  = new statik.Server(__dirname + '/../fixtures', {
                serverInfo: 'own header'
            });

            const response = await fetch(this.getTestServer() + '/hello.txt');
            assert.equal(response.status, 200, 'should respond with 200');
            assert.equal(response.headers.get('content-type'), 'text/plain', 'should respond with text/plain');
            assert.equal(response.headers.get('server'), 'own header', 'should contain custom server header');
            assert.equal(await response.text(), 'hello world', 'should respond with hello world');
        });
        it('serving first 5 bytes of hello.txt', async function () {
            fileServer = new statik.Server(__dirname + '/../fixtures');
            const options = {
                headers: {
                    'Range': 'bytes=0-4'
                }
            };
            const response = await fetch(this.getTestServer() + '/hello.txt', options);

            assert.equal(response.status, 206, 'should respond with 206');
            assert.equal(response.headers.get('content-type'), 'text/plain', 'should respond with text/plain');
            assert.equal(response.headers.get('content-length'), 5, 'should have content-length of 5 bytes');

            assert.equal(response.headers.get('content-range'), 'bytes 0-4/11', 'should have a valid Content-Range header in response');
            assert.equal(await response.text(), 'hello', 'should respond with hello');
        });
        it('serving last 5 bytes of hello.txt', async function () {
            const options = {
                headers: {
                    'Range': 'bytes=6-10'
                }
            };
            const response = await fetch(this.getTestServer() + '/hello.txt', options);
            assert.equal(response.status, 206, 'should respond with 206');
            assert.equal(response.headers.get('content-type'), 'text/plain', 'should respond with text/plain');
            assert.equal(response.headers.get('content-length'), 5, 'should have content-length of 5 bytes');
            assert.equal(response.headers.get('content-range'), 'bytes 6-10/11', 'should have a valid Content-Range header in response');
            assert.equal(await response.text(), 'world', 'should respond with world');
        });
        it('serving first byte of hello.txt', async function (){
            const options = {
                headers: {
                    'Range': 'bytes=0-0'
                }
            };
            const response = await fetch(this.getTestServer() + '/hello.txt', options);
            assert.equal(response.status, 206, 'should respond with 206');
            assert.equal(response.headers.get('content-type'), 'text/plain', 'should respond with text/plain');
            assert.equal(response.headers.get('content-length'), 1, 'should have content-length of 1 bytes');
            assert.equal(response.headers.get('content-range'), 'bytes 0-0/11', 'should have a valid Content-Range header in response');
            assert.equal(await response.text(), 'h', 'should respond with h');
        });
        it('serving all from the start of hello.txt', async function () {
            const options = {
                headers: {
                    'Range': 'bytes=0-'
                }
            };
            const response = await fetch(this.getTestServer() + '/hello.txt', options);
            assert.equal(response.status, 206, 'should respond with 206');
            assert.equal(response.headers.get('content-type'), 'text/plain', 'should respond with text/plain');
            assert.equal(response.headers.get('content-length'), 11, 'should have content-length of 11 bytes');
            assert.equal(response.headers.get('content-range'), 'bytes 0-10/11', 'should have a valid Content-Range header in response');
            assert.equal(await response.text(), 'hello world', 'should respond with "hello world"');
        });
        it('serving directory index', async function (){
            const response = await fetch(this.getTestServer());
            assert.equal(response.status, 200, 'should respond with 200');
            assert.equal(response.headers.get('content-type'), 'text/html', 'should respond with text/html');
        });
        it('serving index.html from the cache', async function () {
            const response = await fetch(this.getTestServer() + '/index.html');

            assert.equal(response.status, 200, 'should respond with 200');
            assert.equal(response.headers.get('content-type'), 'text/html', 'should respond with text/html');
            assert.equal(response.headers.get('cache-control'), 'max-age=3600', 'should respond with cache-control');
        });
        it('requesting with If-None-Match', async function () {
            const serverPath = this.getTestServer();
            let response = await fetch(serverPath + '/index.html');
            response = await fetch(serverPath + '/index.html', {
                headers: {'if-none-match': response.headers.get('etag')}
            });

            assert.equal(response.status, 304, 'should respond with 304');
        })
        it('requesting with If-None-Match and If-Modified-Since', async function () {
            const serverPath = this.getTestServer();
            const response = await fetch(serverPath + '/index.html');
            const modified = Date.parse(response.headers.get('last-modified'));
            const oneDayLater = new Date(modified + (24 * 60 * 60 * 1000)).toUTCString();
            const nonMatchingEtag = '1111222233334444';
            await fetch(serverPath + '/index.html', {
                headers: {
                    'if-none-match': nonMatchingEtag,
                    'if-modified-since': oneDayLater
                }
            });
            assert.equal(response.status, 200, 'should respond with a 200');
        });
        it('requesting POST', async function (){
            const response = await fetch(this.getTestServer() + '/index.html', {
                method: 'POST'
            });
            assert.equal(response.status, 200, 'should respond with 200');
            assert.isNotEmpty(await response.text(), 'should not be empty');
        });

        it('requesting HEAD', async function () {
            const response = await fetch(this.getTestServer() + '/index.html', {
                method: 'HEAD'
            });
            assert.equal(response.status, 200, 'should respond with 200');
            assert.isEmpty(await response.text(), 'head must have no body');
        });

        it('requesting headers', async function () {
            const response = await fetch(this.getTestServer() + '/index.html', {
                method: 'HEAD'
            });
            assert.equal(response.headers.get('server'), 'node-static/' + version, 'should respond with node-static/' + version);
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
            const response = await fetch(this.getTestServer() + '/there/'); // with trailing slash
            assert.equal(response.status, 200, 'should respond with 200');
            assert.equal(response.headers.get('content-type'), 'text/html', 'should respond with text/html');
        });
        it('serving subdirectory embedding website name (should not redirect)', async function () {
            const response = await fetch(this.getTestServer() + '//example.com', {
                redirect: 'manual'
            }); // without trailing slash
            assert.equal(response.status, 200, 'should respond with 200');
            assert.equal(response.headers.get('content-type'), 'text/html', 'should respond with text/html');
        })
        it('redirecting to subdirectory index', async function () {
            const response = await fetch(this.getTestServer() + '/there', {
                redirect: 'manual'
            }); // without trailing slash
            assert.equal(response.status, 301, 'should respond with 301');

            // Todo: set location `endsWith` check back to equality check
            //   when this may be fixed:
            //   https://github.com/node-fetch/node-fetch/issues/1086
            // assert.equal(response.headers.get('location'), '/there/', 'should respond with location header'); // now with trailing slash
            assert(response.headers.get('location').endsWith('/there/'), 'should respond with location header'); // now with trailing slash

            assert.equal(await response.text(), '', 'should respond with empty string body');
        });
        it('requesting a subdirectory (with trailing slash) not found', async function () {
            const response = await fetch(this.getTestServer() + '/notthere/'); // with trailing slash
            assert.equal(response.status, 404, 'should respond with 404');
        });
        it('requesting a subdirectory (without trailing slash) not found', async function () {
            const response = await fetch(this.getTestServer() + '/notthere', {
                redirect: 'manual'
            }); // without trailing slash
            assert.equal(response.status, 404, 'should respond with 404');
        });
    });
    describe('once an http server is listening with custom index configuration', function () {
        before(function () {
            fileServer = new statik.Server(__dirname + '/../fixtures', { indexFile: "hello.txt" });
        });
        beforeEach(async function () {
            await setupStaticServer(this);
        });
        afterEach(async function () {
            this.server.close();
        });

        it('serving custom index file', async function () {
            const response = await fetch(this.getTestServer() + '/');
            assert.equal(response.status, 200, 'should respond with 200');
            assert.equal(await response.text(), 'hello world', 'should respond with hello world');
        });

        it('handling malicious urls', async function () {
            const response = await fetch(this.getTestServer() + '/%00');
            assert.equal(response.status, 404, 'should respond with 404');
        });

        it('serving custom index file', async function () {
            const response = await fetch(this.getTestServer() + '/');
            assert.equal(response.status, 200, 'should respond with 200');
            assert.equal(await response.text(), 'hello world', 'should respond with hello world');
        });
    });

    describe('once an http server is listening with JSON files configuration', function () {
        before(function () {
            fileServer = new statik.Server(__dirname + '/../fixtures/index-with-json');
        });
        beforeEach(async function () {
            await setupStaticServer(this);
        });
        afterEach(async function () {
            this.server.close();
        });

        it('serving JSON file', async function () {
            const response = await fetch(this.getTestServer() + '/');
            assert.equal(response.status, 200, 'should respond with 200');
            assert.equal(await response.text(), 'hello world', 'should respond with hello world');
        });
    });

    describe('once an http server is listening with missing JSON files configuration', function () {
        before(function () {
            fileServer = new statik.Server(__dirname + '/../fixtures/index-without-json');
        });
        beforeEach(async function () {
            await setupStaticServer(this);
        });
        afterEach(async function () {
            this.server.close();
        });

        it('returns 404 with missing JSON file', async function () {
            const response = await fetch(this.getTestServer() + '/');
            assert.equal(response.status, 404, 'should respond with 404');
        });
    });

    describe('once an http server is listening with multiple JSON files configuration', function () {
        before(function () {
            fileServer = new statik.Server(__dirname + '/../fixtures/index-with-json-files');
        });
        beforeEach(async function () {
            await setupStaticServer(this);
        });
        afterEach(async function () {
            this.server.close();
        });

        it('returns 200 with missing JSON file', async function () {
            const response = await fetch(this.getTestServer() + '/');
            assert.equal(response.status, 200, 'should respond with 200');
            assert.equal(await response.text(), 'Hi\nhello world', 'should respond with Hi\nhello world');
        });
    });

    describe('once an http server is listening with bad JSON files configuration', function () {
        before(function () {
            fileServer = new statik.Server(__dirname + '/../fixtures/index-with-bad-json');
        });
        beforeEach(async function () {
            await setupStaticServer(this);
        });
        afterEach(async function () {
            this.server.close();
        });

        it('returns 404 with missing file from JSON file', async function () {
            const response = await fetch(this.getTestServer() + '/');
            assert.equal(response.status, 404, 'should respond with 404');
        });
    });

    describe('once an http server is listening with malformed JSON files configuration', function () {
        before(function () {
            fileServer = new statik.Server(__dirname + '/../fixtures/index-with-malformed-json-files');
        });
        beforeEach(async function () {
            await setupStaticServer(this);
        });
        afterEach(async function () {
            this.server.close();
        });

        it('returns 404 with missing file from JSON file', async function () {
            const response = await fetch(this.getTestServer() + '/');
            assert.equal(response.status, 404, 'should respond with 404');
        });
    });

    describe('default extension', function () {
        beforeEach(async function () {
            await setupStaticServer(this);
        });
        afterEach(async function () {
            this.server.close();
        });
        it('finding a file by default extension', async function() {
            fileServer = new statik.Server(__dirname+'/../fixtures', {defaultExtension: "txt"});

            const response = await fetch(this.getTestServer() + '/hello');

            assert.equal(response.status, 200, 'should respond with 200');
            assert.equal(response.headers.get('content-type'), 'text/plain', 'should respond with text/plain');
            assert.equal(await response.text(), 'hello world', 'should respond with hello world');
        });
        it('default extension does not interfere with folders', async function () {
            fileServer = new statik.Server(__dirname+'/../fixtures', {defaultExtension: "html"});

            const response = await fetch(
                this.getTestServer() + '/there',
                {redirect: 'manual'}
            ); // without trailing slash

            assert.equal(response.status, 301, 'should respond with 301');

            // Todo: set location `endsWith` check back to equality check
            //   when this may be fixed:
            //   https://github.com/node-fetch/node-fetch/issues/1086
            // assert.equal(response.headers.get('location'), '/there/', 'should respond with location header'); // now with trailing slash
            assert(response.headers.get('location').endsWith('/there/'), 'should respond with location header'); // now with trailing slash

            assert.equal(await response.text(), '', 'should respond with empty string body');
        });
    });
    describe('once an http server is listening with custom cache configuration', function () {
        beforeEach(async function () {
            await setupStaticServer(this);
            fileServer  = new statik.Server(__dirname + '/../fixtures', {
                cache: {
                    '**/*.txt': 100,
                    '**/': 300
                }
            });
        });
        afterEach(async function () {
            this.server.close();
        });

        it('requesting custom cache index file', async function () {
            const response = await fetch(this.getTestServer() + '/');
            assert.equal(response.status, 200, 'should respond with 200');
            assert.equal(response.headers.get('cache-control'), 'max-age=300', 'should respond with cache-control');
        });
        it('requesting custom cache text file', async function () {
            const response = await fetch(this.getTestServer() + '/hello.txt');

            assert.equal(response.status, 200, 'should respond with 200');
            assert.equal(response.headers.get('cache-control'), 'max-age=100', 'should respond with cache-control');
        });
        it('requesting custom cache un-cached file', async function () {
            const response = await fetch(this.getTestServer() + '/empty.css');
            assert.equal(response.status, 200, 'should respond with 200');
            assert.equal(response.headers.get('cache-control'), undefined, 'should not respond with cache-control');
        });
    });
});
