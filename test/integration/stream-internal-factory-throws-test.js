import http from 'http';
import {assert} from 'chai';
import fetch from 'node-fetch';
import * as statik from '../../lib/node-static.js';

const __dirname = import.meta.dirname;

it('stream reports error when transform factory throws inside stream (direct stream call)', function (done) {
    const factory = () => { throw new Error('factory-stream-failed'); };
    const serverObj = new statik.Server(__dirname + '/../fixtures', { transform: factory });

    const server = http.createServer(function (request, response) {
        serverObj.stream(null, ['hello.txt'], 11, 0, response, request, true, (err) => {
            try {
                assert.isNotNull(err, 'expected an error from transform factory');
                assert.equal(err.message, 'factory-stream-failed');
                response.end();
                server.close();
                done();
            } catch (e) {
                server.close();
                done(e);
            }
        });
    });

    server.listen(9030, async () => {
        // Trigger the request handler
        await fetch('http://localhost:9030/hello.txt').catch(() => {});
    });
});
