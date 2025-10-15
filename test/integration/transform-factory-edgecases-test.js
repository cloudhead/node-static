import http from 'http';
import {assert} from 'chai';
import fetch from 'node-fetch';
import * as statik from '../../lib/node-static.js';

const __dirname = import.meta.dirname;

it('responds 500 when transform factory throws', async function () {
    const factory = () => { throw new Error('factory failed'); };

    const server = http.createServer((req, res) => {
        const s = new statik.Server(__dirname + '/../fixtures', { transform: factory });
        s.serve(req, res);
    }).listen(9020);

    const response = await fetch('http://localhost:9020/hello.txt');
    assert.equal(response.status, 500);

    server.close();
});

it('falls back to piping original stream when factory returns non-stream', async function () {
    let called = false;

    /** @type {import('../../lib/node-static.js').TransformCallback} */
    const factory = () => {
        called = true;
        // @ts-expect-error Just testing
        return null;
    };

    const server = http.createServer((req, res) => {
        const s = new statik.Server(__dirname + '/../fixtures', { transform: factory });
        s.serve(req, res);
    }).listen(9021);

    const response = await fetch('http://localhost:9021/hello.txt');
    assert.equal(response.status, 200);
    const body = await response.text();
    assert.isTrue(called, 'factory should have been called');
    assert.equal(body, 'hello world');

    server.close();
});
