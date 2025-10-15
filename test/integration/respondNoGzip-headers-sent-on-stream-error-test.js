import http from 'http';
import fetch from 'node-fetch';
import {assert} from 'chai';
import * as statik from '../../lib/node-static.js';

const __dirname = import.meta.dirname;

it('respondNoGzip handles stream errors after headers sent by ending response', function (done) {
    const serverObj = new statik.Server(__dirname + '/../fixtures');

    const server = http.createServer(function (req, res) {
        // Create a fake stat object with necessary fields. Use size=0 so
        // a prematurely ended response doesn't block waiting for bytes.
        const stat = { size: 0, mtime: new Date(), ino: 1 };
        // Call respondNoGzip with a file that does not exist to force a read error
        serverObj.respondNoGzip(null, 200, 'text/plain', {}, ['this-file-does-not-exist.txt'], stat, req, res, function () {
            // finish callback shouldn't be called in this path
        });
    });

    server.listen(9040, async () => {
        try {
            const resp = await fetch('http://localhost:9040/this-file-does-not-exist.txt');
            // Because headers were sent before streaming, the response should be 200
            assert.equal(resp.status, 200);
            server.close();
            done();
        } catch (e) {
            server.close();
            done(e);
        }
    });
});
