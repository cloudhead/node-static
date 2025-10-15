import {assert} from 'chai';
import * as statik from '../../lib/node-static.js';

it('respondNoGzip calls finish with 500 when stream callback errors and headers not sent', function (done) {
    const s = new statik.Server('./');

    // monkeypatch stream to synchronously invoke callback with error
    s.stream = function (key, files, length, startByte, res, req, applyTransform, cb) {
        if (typeof cb === 'function') cb(new Error('stream-cb-error'));
    };

    // fake req/stat/res

    const req = { headers: {} };
    const stat = { size: 0, mtime: new Date(), ino: 1 };

    /** @type {import('node:http').OutgoingHttpHeaders} */
    const headers = {};

    // res with writeHead that does not set headersSent
    const res = {
        getHeaders() { return {}; },
        headersSent: false,
        writeHead() { /* intentionally doesn't set headersSent */ },
        end() { /* noop */ }
    };

    s.respondNoGzip(
        null, 200, 'text/plain', headers, ['file.txt'], stat,
        // @ts-expect-error Just a stub
        req,
        res,
        function (status, hdrs) {
            try {
                assert.equal(status, 500);
                done();
            } catch (err) { done(err); }
        }
    );
});
