import {assert} from 'chai';
import * as statik from '../../lib/node-static.js';

it('respondNoGzip swallows res.end() errors when headersSent is true', function (done) {
    const serverObj = new statik.Server('.');

    // Fake request and stat
    const req = { headers: {} };
    const stat = { size: 10, mtime: new Date(), ino: 1 };

    // Track if finish was called
    let finishCalled = false;

    // Fake response with headersSent true and end throws
    let endCalls = 0;
    const res = {
        headersSent: true,
        writeHead() {},
        getHeaders() { return {}; },
        end() { endCalls += 1; throw new Error('end-throws'); }
    };

    // Stub stream to immediately call callback with an error
    serverObj.stream = function (key, files, length, startByte, resp, req2, applyTransform, cb) {
        // simulate async
        process.nextTick(() => cb && cb(new Error('stream-error')));
    };

    serverObj.respondNoGzip(
        null, 200, 'text/plain', {}, ['missing.txt'], stat,
        // @ts-expect-error Just a stub
        req,
        res,
        function () {
            finishCalled = true;
        }
    );

    // Give the nextTick a chance
    setTimeout(() => {
        try {
            assert.isFalse(finishCalled, 'finish should not be called when headers were sent');
            assert.equal(endCalls, 1, 'res.end should have been invoked once');
            done();
        } catch (e) { done(e); }
    }, 10);
});
