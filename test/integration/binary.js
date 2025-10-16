import {join} from 'node:path';
import {unlink} from 'node:fs/promises';

import {assert} from 'chai';
import fetch from 'node-fetch';

import {spawnPromise, spawnConditional} from '../utils/spawnPromise.js';

const __dirname = import.meta.dirname;

const binFile = join(__dirname, '../../bin/cli.js');
const fixturePath = join(__dirname, '../fixtures');
const autoGzPath = join(__dirname, '../fixtures/auto-gz-hello.txt.gz');

let testPort = 8281;

/**
 * @param {Mocha.Context} obj
 */
async function updatePort (obj) {
    obj.port = ++testPort;
}


describe('node-static (CLI)', function () {
    it('Gets help text', async function () {
        const {stdout} =
            /**
             * @type {{ stdout: string; stderr: string; }}
             */
            (await spawnPromise(binFile, ['-h']));
        assert.match(stdout, /USAGE: /u);
    });

    describe('Get files', function () {
        const timeout = 10000;
        this.timeout(timeout);
        beforeEach(async function () {
            await updatePort(this);
        });
        it('serving file within directory', async function () {
            const {response /* , stdout */} =
                /**
                 * @type {{
                 *   response: Response,
                 *   stdout: string
                 * }}
                 */ (await spawnConditional(
                    binFile,
                    [
                        '-p', this.port, fixturePath
                    ],
                    timeout - 9000,
                    {
                        condition: /serving ".*?"/,
                        action: (/* err, stdout */) => {
                            return fetch(
                                `http://localhost:${this.port}/hello.txt`
                            );
                        }
                    }));

            const {status} = response;
            const contentType = response.headers.get('content-type');
            const text = await response.text();

            assert.equal(status, 200, 'should respond with 200');
            assert.equal(contentType, 'text/plain', 'should respond with text/plain');
            assert.equal(text, 'hello world', 'should respond with hello world');
        });

        it('serving file within directory with UTF-8 content-type', async function () {
            const {response /* , stdout */} =
                /**
                 * @type {{
                 *   response: Response,
                 *   stdout: string
                 * }}
                 */ (await spawnConditional(
                    binFile,
                    [
                        '-p', this.port, fixturePath,
                        '-H', JSON.stringify({
                            'Content-Type': 'text/html;charset=UTF-8'
                        })
                    ],
                    timeout - 9000,
                    {
                        condition: /serving ".*?"/,
                        action: (/* err, stdout */) => {
                            return fetch(
                                `http://localhost:${this.port}/utf8.html`
                            );
                        }
                    }));

            const {status} = response;
            const contentType = response.headers.get('content-type');
            const text = await response.text();

            assert.equal(status, 200, 'should respond with 200');
            assert.equal(contentType, 'text/html', 'should respond with text/html');
            assert.include(text, '你好，世界！', 'should respond with hello world in Chinese');
        });

        it('serving file within directory with server info', async function () {
            const {response /* , stdout */} =
                /**
                 * @type {{
                 *   response: Response,
                 *   stdout: string
                 * }}
                 */ (await spawnConditional(
                    binFile,
                    [
                        '-p', this.port, fixturePath,
                        '--server-info', 'my-server'
                    ],
                    timeout - 9000,
                    {
                        condition: /serving ".*?"/,
                        action: (/* err, stdout */) => {
                            return fetch(
                                `http://localhost:${this.port}/hello.txt`
                            );
                        }
                    }));

            const {status} = response;
            const contentType = response.headers.get('content-type');
            const server = response.headers.get('server');
            const text = await response.text();

            assert.equal(status, 200, 'should respond with 200');
            assert.equal(contentType, 'text/plain', 'should respond with text/plain');
            assert.equal(server, 'my-server', 'should respond with my-server')
            assert.equal(text, 'hello world', 'should respond with hello world');
        });

        it('serving file within directory with default extension', async function () {
            const {response /* , stdout */} =
                /**
                 * @type {{
                 *   response: Response,
                 *   stdout: string
                 * }}
                 */ (await spawnConditional(
                    binFile,
                    [
                        '-p', this.port, fixturePath,
                        '--default-extension', 'txt'
                    ],
                    timeout - 9000,
                    {
                        condition: /serving ".*?"/,
                        action: (/* err, stdout */) => {
                            return fetch(
                                `http://localhost:${this.port}/hello`
                            );
                        }
                    }));

            const {status} = response;
            const contentType = response.headers.get('content-type');
            const text = await response.text();

            assert.equal(status, 200, 'should respond with 200');
            assert.equal(contentType, 'text/plain', 'should respond with text/plain');
            assert.equal(text, 'hello world', 'should respond with hello world');
        });

        it('serving file within directory with hidden extension', async function () {
            const {response /* , stdout */} =
                /**
                 * @type {{
                 *   response: Response,
                 *   stdout: string
                 * }}
                 */ (await spawnConditional(
                    binFile,
                    [
                        '-p', this.port, fixturePath,
                        '--serve-hidden'
                    ],
                    timeout - 9000,
                    {
                        condition: /serving ".*?"/,
                        action: (/* err, stdout */) => {
                            return fetch(
                                `http://localhost:${this.port}/.hidden-hello.txt`
                            );
                        }
                    }));

            const {status} = response;
            const contentType = response.headers.get('content-type');
            const text = await response.text();

            assert.equal(status, 200, 'should respond with 200');
            assert.equal(contentType, 'text/plain', 'should respond with text/plain');
            assert.equal(text, 'hello world', 'should respond with hello world');
        });

        it('serving 404 for file with hidden extension', async function () {
            const {response /* , stdout */} =
                /**
                 * @type {{
                 *   response: Response,
                 *   stdout: string
                 * }}
                 */ (await spawnConditional(
                    binFile,
                    [
                        '-p', this.port, fixturePath
                    ],
                    timeout - 9000,
                    {
                        condition: /serving ".*?"/,
                        action: (/* err, stdout */) => {
                            return fetch(
                                `http://localhost:${this.port}/.hidden-hello.txt`
                            );
                        }
                    }));

            const {status} = response;
            const text = await response.text();

            assert.equal(status, 404, 'should respond with 404');
            assert.equal(text, 'Not Found', 'should respond with Not Found');
        });

        it('serving file without directory', async function () {
            const {response /* , stdout */} =
                /**
                 * @type {{
                 *   response: Response,
                 *   stdout: string
                 * }}
                 */ (await spawnConditional(binFile, [
                    '-p', this.port
                ], timeout - 9000, {
                    condition: /serving "."/,
                    action: (/* err, stdout */) => {
                        return fetch(
                            `http://localhost:${this.port}/test/fixtures/hello.txt`
                        );
                    }
                }));

            const {status} = response;
            const contentType = response.headers.get('content-type');
            const cacheControl = response.headers.get('cache-control');
            const text = await response.text();

            assert.equal(status, 200, 'should respond with 200');
            assert.equal(contentType, 'text/plain', 'should respond with text/plain');
            assert.equal(text, 'hello world', 'should respond with hello world');
            assert.equal(cacheControl, 'max-age=3600', 'should respond with cache-control');
        });

        it('serving file within directory and 404', async function () {
            const {response /* , stdout */} =
                /**
                 * @type {{
                 *   response: Response,
                 *   stdout: string
                 * }}
                 */
                (await spawnConditional(binFile, [
                    '-p', this.port, fixturePath
                ], timeout - 9000, {
                    condition: /serving ".*?"/,
                    action: (/* err, stdout */) => {
                        return fetch(
                            `http://localhost:${this.port}/bad-file`
                        );
                    }
                }));

            const {status} = response;
            const text = await response.text();

            assert.equal(status, 404, 'should respond with 404');
            assert.equal(text, 'Not Found', 'should respond with Not Found');
        });

        it('serving file within directory and indexFile', async function () {
            const {response /* , stdout */} =
                /**
                 * @type {{
                 *   response: Response,
                 *   stdout: string
                 * }}
                 */
                (await spawnConditional(binFile, [
                    '-p', this.port, fixturePath, '--index-file', 'hello.txt'
                ], timeout - 9000, {
                    condition: /serving ".*?"/,
                    action: (/* err, stdout */) => {
                        return fetch(
                            `http://localhost:${this.port}/`
                        );
                    }
                }));

            const {status} = response;
            const contentType = response.headers.get('content-type');
            const text = await response.text();

            assert.equal(status, 200, 'should respond with 200');
            assert.equal(contentType, 'text/plain', 'should respond with text/plain');
            assert.equal(text, 'hello world', 'should respond with hello world');
        });

        it('serving file within directory and spa and indexFile', async function () {
            const {response /* , stdout */} =
                /**
                 * @type {{
                 *   response: Response,
                 *   stdout: string
                 * }}
                 */
                (await spawnConditional(binFile, [
                    '-p', this.port, fixturePath, '--index-file', 'hello.txt', '--spa'
                ], timeout - 9000, {
                    condition: /serving ".*?"/,
                    error (err) {
                        console.log('err', err);
                    },
                    action: (/* err, stdout */) => {
                        return fetch(
                            `http://localhost:${this.port}/some/other/path`
                        );
                    }
                }));

            const {status} = response;
            const contentType = response.headers.get('content-type');
            const text = await response.text();

            assert.equal(status, 200, 'should respond with 200');
            assert.equal(contentType, 'text/plain', 'should respond with text/plain');
            assert.equal(text, 'hello world', 'should respond with hello world');
        });

        it('serving file within directory and spa and default indexFile (and default port)', async function () {
            const {response /* , stdout */} =
                /**
                 * @type {{
                 *   response: Response,
                 *   stdout: string
                 * }}
                 */
                (await spawnConditional(binFile, [
                    fixturePath, '--spa'
                ], timeout - 9000, {
                    condition: 'serving as a single page app',
                    error (err) {
                        console.log('err', err);
                    },
                    action: (/* err, stdout */) => {
                        return fetch(
                            `http://localhost:8080/some/other/path`
                        );
                    }
                }));

            const {status} = response;
            const contentType = response.headers.get('content-type');
            // const text = await response.text();

            assert.equal(status, 200, 'should respond with 200');
            assert.equal(contentType, 'text/html', 'should respond with text/html');
            // assert.contains(text, 'hello world', 'should respond with hello world');
        });

        it('serving file within directory with headers', async function () {
            const {response /* , stdout */} =
                /**
                 * @type {{
                 *   response: Response,
                 *   stdout: string
                 * }}
                 */
                (await spawnConditional(binFile, [
                    '-p', this.port,
                    '--headers', JSON.stringify({
                        'Access-Control-Allow-Origin': '*'
                    }),
                    fixturePath
                ], timeout - 9000, {
                    condition: /serving ".*?"/,
                    action: (/* err, stdout */) => {
                        return fetch(
                            `http://localhost:${this.port}/hello.txt`
                        );
                    }
                }));

            const {status} = response;
            const contentType = response.headers.get('content-type');
            const allowOrigin = response.headers.get('Access-Control-Allow-Origin');
            const text = await response.text();

            assert.equal(status, 200, 'should respond with 200');
            assert.equal(contentType, 'text/plain', 'should respond with text/plain');
            assert.equal(allowOrigin, '*', 'should respond with all origins');
            assert.equal(text, 'hello world', 'should respond with hello world');
        });

        it('serving file within directory with header file', async function () {
            const {response /* , stdout */} =
                /**
                 * @type {{
                 *   response: Response,
                 *   stdout: string
                 * }}
                 */
                (await spawnConditional(binFile, [
                    '-p', this.port,
                    '--header-file',
                    fixturePath + '/header-file.json',
                    fixturePath
                ], timeout - 9000, {
                    condition: /serving ".*?"/,
                    action: (/* err, stdout */) => {
                        return fetch(
                            `http://localhost:${this.port}/hello.txt`
                        );
                    }
                }));

            const {status} = response;
            const contentType = response.headers.get('content-type');
            const allowOrigin = response.headers.get('Access-Control-Allow-Origin');
            const text = await response.text();

            assert.equal(status, 200, 'should respond with 200');
            assert.equal(contentType, 'text/plain', 'should respond with text/plain');
            assert.equal(allowOrigin, '*', 'should respond with all origins');
            assert.equal(text, 'hello world', 'should respond with hello world');
        });

        it('serving file within directory and gzip', async function () {
            const {response /* , stdout */} =
                /**
                 * @type {{
                 *   response: Response,
                 *   stdout: string
                 * }}
                 */
                (await spawnConditional(binFile, [
                    '-p', this.port, fixturePath, '--gzip'
                ], timeout - 9000, {
                    condition: /serving ".*?"/,
                    action: (/* err, stdout */) => {
                        return fetch(
                            `http://localhost:${this.port}/hello.txt`, {
                                headers: {
                                    'accept-encoding': 'gzip'
                                }
                            }
                        );
                    }
                }));

            const {status} = response;
            const contentType = response.headers.get('content-type');
            const contentEncoding = response.headers.get('content-encoding');
            const text = await response.text();

            assert.equal(status, 200, 'should respond with 200');
            assert.equal(contentType, 'text/plain', 'should respond with text/plain');
            assert.equal(contentEncoding, 'gzip', 'should respond with gzip encoding');
            assert.equal(text, 'hello world', 'should respond with hello world');
        });

        describe('`gzipAuto`', function () {
            const tryUnlink = async () => {
                try {
                    await unlink(autoGzPath);
                } catch (err) {
                    if (/** @type {NodeJS.ErrnoException} */ (err).code !== 'ENOENT') {
                        throw err;
                    }
                }
            };
            beforeEach(async () => {
                await tryUnlink();
            });
            afterEach(async () => {
                await tryUnlink();
            });
            it('serving file within directory and gzip and gzipAuto', async function () {
                const {response /* , stdout */} =
                    /**
                     * @type {{
                     *   response: Response,
                     *   stdout: string
                     * }}
                     */
                    (await spawnConditional(binFile, [
                        '-p', this.port, fixturePath, '--gzip', '--gzip-auto'
                    ], timeout - 9000, {
                        condition: /serving ".*?"/,
                        action: (/* err, stdout */) => {
                            return fetch(
                                `http://localhost:${this.port}/auto-gz-hello.txt`, {
                                    headers: {
                                        'accept-encoding': 'gzip'
                                    }
                                }
                            );
                        }
                    }));

                const {status} = response;
                const contentType = response.headers.get('content-type');
                const contentEncoding = response.headers.get('content-encoding');
                const text = await response.text();

                assert.equal(status, 200, 'should respond with 200');
                assert.equal(contentType, 'text/plain', 'should respond with text/plain');
                assert.equal(contentEncoding, 'gzip', 'should respond with gzip encoding');
                assert.equal(text, 'hello world', 'should respond with hello world');
            });
        });

        it('serving file within directory and gzip and gzipOnly', async function () {
            const {response /* , stdout */} =
                /**
                 * @type {{
                 *   response: Response,
                 *   stdout: string
                 * }}
                 */
                (await spawnConditional(binFile, [
                    '-p', this.port, fixturePath, '--gzip',
                    '--gzip-only', 'allow'
                ], timeout - 9000, {
                    condition: /serving ".*?"/,
                    action: (/* err, stdout */) => {
                        return fetch(
                            `http://localhost:${this.port}/lone-hello.txt`, {
                                headers: {
                                    'accept-encoding': 'gzip'
                                }
                            }
                        );
                    }
                }));

            const {status} = response;
            const contentType = response.headers.get('content-type');
            const contentEncoding = response.headers.get('content-encoding');
            const text = await response.text();

            assert.equal(status, 200, 'should respond with 200');
            assert.equal(contentType, 'text/plain', 'should respond with text/plain');
            assert.equal(contentEncoding, 'gzip', 'should respond with gzip encoding');
            assert.equal(text, 'hello world', 'should respond with hello world');
        });

        it('serving file within directory and gzip but without gzip accept request', async function () {
            const {response /* , stdout */} =
                /**
                 * @type {{
                 *   response: Response,
                 *   stdout: string
                 * }}
                 */
                (await spawnConditional(binFile, [
                    '-p', this.port, fixturePath, '--gzip'
                ], timeout - 9000, {
                    condition: /serving ".*?"/,
                    action: (/* err, stdout */) => {
                        return fetch(
                            `http://localhost:${this.port}/hello.txt`, {
                                headers: {
                                    'accept-encoding': 'nothing'
                                }
                            }
                        );
                    }
                }));

            const {status} = response;
            const contentType = response.headers.get('content-type');
            const contentEncoding = response.headers.get('content-encoding');
            const text = await response.text();

            assert.equal(status, 200, 'should respond with 200');
            assert.equal(contentType, 'text/plain', 'should respond with text/plain');
            assert.equal(contentEncoding, null, 'should not respond with gzip encoding');
            assert.equal(text, 'hello world', 'should respond with hello world');
        });

        it('serves custom cache', async function () {
            const {response: responses /* , stdout */} =
                /**
                 * @type {{
                 *   response: Response[],
                 *   stdout: string
                 * }}
                 */
                (await spawnConditional(binFile, [
                    '-p', this.port, '--cache', JSON.stringify({
                        '**/*.txt': 100,
                        '**/': 300
                    }), fixturePath
                ], timeout - 9000, {
                    condition: /serving ".*?"/,
                    error (err) {
                        throw err;
                    },
                    action: (/* err, stdout */) => {
                        return Promise.all([
                            fetch(
                                `http://localhost:${this.port}/`
                            ),
                            fetch(
                                `http://localhost:${this.port}/hello.txt`
                            ),
                            fetch(
                                `http://localhost:${this.port}/empty.css`
                            )
                        ]);
                    }
                }));

            [
                ['max-age=300'],
                ['max-age=100'],
                [undefined]
            ].forEach(([expectedCacheControl], i) => {
                const response = responses[i];
                const {status} = response;
                const cacheControl = response.headers.get('cache-control');
                // const contentType = response.headers.get('content-type');
                // const text = await response.text();

                assert.equal(status, 200, 'should respond with 200');
                assert.equal(cacheControl, expectedCacheControl, 'should respond with cache-control or lack');
            });
        });
    });
});
