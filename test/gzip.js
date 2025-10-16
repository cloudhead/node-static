import {
    createReadStream,
    createWriteStream,
} from 'node:fs';
import { createGzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';

/**
 * @param {string} input
 * @param {string} output
 */
async function gzip (input, output) {
    const gzip = createGzip();
    const source = createReadStream(input);
    const destination = createWriteStream(output);
    await pipeline(source, gzip, destination);
}

await gzip(
    import.meta.dirname + '/fixtures/hello.txt',
    import.meta.dirname + '/fixtures/hello.txt.gz'
);
