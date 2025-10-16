import {
    writeFile
} from 'node:fs/promises';
import {
    setTimeout,
} from 'node:timers/promises';
import { gzip } from '../lib/node-static/gzip.js';

await Promise.all([
    gzip(
        import.meta.dirname + '/fixtures/hello.txt',
        import.meta.dirname + '/fixtures/hello.txt.gz'
    ),
    gzip(
        import.meta.dirname + '/fixtures/hello.txt',
        import.meta.dirname + '/fixtures/hello-with-older-gz.txt.gz'
    ),
    gzip(
        import.meta.dirname + '/fixtures/hello.txt',
        import.meta.dirname + '/fixtures/lone-hello.txt.gz'
    )
]);

// Add delay to ensure source file is newer
await setTimeout(100);
writeFile(
    import.meta.dirname + '/fixtures/hello-with-older-gz.txt',
    'hello world',
    'utf8'
);
