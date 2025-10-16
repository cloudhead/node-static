import { createGzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import {
    createReadStream,
    createWriteStream,
} from 'node:fs';

/**
 * @param {string} input
 * @param {string} output
 */
export async function gzip (input, output) {
    const gzip = createGzip();
    const source = createReadStream(input);
    const destination = createWriteStream(output);
    return await pipeline(source, gzip, destination);
}
