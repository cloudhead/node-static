import {writeFile} from 'fs/promises';
import {gzip} from 'node-gzip';

await writeFile(
    import.meta.dirname + '/fixtures/hello.txt.gz',
    await gzip('hello world')
);
