import http from 'http';
import {assert} from 'chai';
import fetch from 'node-fetch';
import {Transform} from 'stream';
import * as statik from '../../lib/node-static.js';

const __dirname = import.meta.dirname;

it('handles transform runtime error emitted from transform stream', function (done) {
    const factory = () => new Transform({
        transform(chunk, _enc, cb) {
            cb(new Error('transform runtime error'));
        }
    });

    const s = new statik.Server(__dirname + '/../fixtures', { transform: factory });

    const server = http.createServer((req, res) => {
        s.serve(req, res);
    }).listen(9031, async () => {
        const response = await fetch('http://localhost:9031/hello.txt');
        // When transform errors, server should still respond (possibly 500),
        //   but not crash
        assert.oneOf(response.status, [200, 500]);
        server.close();
        done();
    });
});
