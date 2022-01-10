import {join, dirname} from 'path';
import {fileURLToPath} from 'url';

import {assert} from 'chai';
import fetch from 'node-fetch';

import {spawnPromise, spawnConditional} from '../utils/spawnPromise.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const binFile = join(__dirname, '../../bin/cli.js');
const fixturePath = join(__dirname, '../fixtures');

let testPort = 8281;
async function updatePort (obj) {
    obj.port = ++testPort;
}


describe('node-static (CLI)', function () {
    it('Gets help text', async function () {
        const {stdout} = await spawnPromise(binFile, ['-h']);
        assert.match(stdout, /USAGE: /u);
    });

    describe('Get files', function () {
        const timeout = 10000;
        this.timeout(timeout);
        beforeEach(async function () {
            await updatePort(this);
        });
        it('serving file within directory', async function () {
            const {response /* , stdout */} = await spawnConditional(binFile, [
                '-p', this.port, fixturePath
            ], timeout - 9000, {
                condition: /serving ".*?"/,
                action: (/* err, stdout */) => {
                    return fetch(
                        `http://localhost:${this.port}/hello.txt`
                    );
                }
            });

            const {status} = response;
            const contentType = response.headers.get('content-type');
            const text = await response.text();

            assert.equal(status, 200, 'should respond with 200');
            assert.equal(contentType, 'text/plain', 'should respond with text/plain');
            assert.equal(text, 'hello world', 'should respond with hello world');
        });

        it('serving file without directory', async function () {
            const {response /* , stdout */} = await spawnConditional(binFile, [
                '-p', this.port
            ], timeout - 9000, {
                condition: /serving "."/,
                action: (/* err, stdout */) => {
                    return fetch(
                        `http://localhost:${this.port}/test/fixtures/hello.txt`
                    );
                }
            });

            const {status} = response;
            const contentType = response.headers.get('content-type');
            const cacheControl = response.headers.get('cache-control');
            const text = await response.text();

            assert.equal(status, 200, 'should respond with 200');
            assert.equal(contentType, 'text/plain', 'should respond with text/plain');
            assert.equal(text, 'hello world', 'should respond with hello world');
            assert.equal(cacheControl, 'max-age=3600', 'should respond with cache-control');
        });

        it('serves custom cache', async function () {
            const {response: responses /* , stdout */} = await spawnConditional(binFile, [
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
            });

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
