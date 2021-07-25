import {join, dirname} from 'path';
import {fileURLToPath} from 'url';

import {assert} from 'chai';
import fetch from 'node-fetch';

import {spawnPromise, spawnConditional} from '../utils/spawnPromise.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const binFile = join(__dirname, '../../bin/cli.js');
const fixturePath = join(__dirname, '../fixtures');

let testPort = 8081;
async function updatePort (obj) {
    obj.port = ++testPort;
}


describe('node-static (CLI)', function () {
    it('Gets help text', async function () {
        const {stdout} = await spawnPromise(binFile, ['-h'], 1000);
        assert.match(stdout, /USAGE: /u);
    });

    describe('Get files', function () {
        const timeout = 10000;
        this.timeout(timeout);
        beforeEach(async function () {
            await updatePort(this);
        });
        it('serving hello.txt', async function () {
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
    });
});
