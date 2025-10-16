import {
    createReadStream,
    createWriteStream,
} from 'node:fs';
import {
    writeFile
} from 'node:fs/promises';
import {
    setTimeout,
} from 'node:timers/promises';
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

await Promise.all([
    gzip(
        import.meta.dirname + '/fixtures/hello.txt',
        import.meta.dirname + '/fixtures/hello.txt.gz'
    ),
    gzip(
        import.meta.dirname + '/fixtures/hello.txt',
        import.meta.dirname + '/fixtures/hello-with-older-gz.txt.gz'
    )
]);

// Add delay to ensure source file is newer
await setTimeout(100);
writeFile(
    import.meta.dirname + '/fixtures/hello-with-older-gz.txt',
    'hello world',
    'utf8'
);
