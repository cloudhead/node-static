import http from 'http';
import {assert} from 'chai';
import fetch from 'node-fetch';
import {Transform} from 'stream';
import * as statik from '../../lib/node-static.js';

const __dirname = import.meta.dirname;

it('invokes custom transform factory and applies its transform', async function () {
    let called = false;

    const factory = (/* file, pathname, req, res */) => {
        called = true;
        return new Transform({
            transform(chunk, _enc, cb) {
                cb(null, chunk.toString().toUpperCase() + '\n--CUSTOM--');
            }
        });
    };

    const server = http.createServer((req, res) => {
        const s = new statik.Server(__dirname + '/../fixtures', { transform: factory });
        s.serve(req, res);
    }).listen(9010);

    const response = await fetch('http://localhost:9010/hello.txt');
    assert.equal(response.status, 200);
    const body = await response.text();
    assert.isTrue(called, 'factory should have been called');
    assert.equal(body, 'HELLO WORLD\n--CUSTOM--');

    server.close();
});
