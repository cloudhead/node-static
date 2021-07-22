import {promisify} from 'util';
import {join, dirname} from 'path';
import {fileURLToPath} from 'url';

import {execFile as ef} from 'child_process';
import {assert} from 'chai';

const execFile = promisify(ef);

const __dirname = dirname(fileURLToPath(import.meta.url));

const binFile = join(__dirname, '../../bin/cli.js');

describe('node-static (CLI)', function () {
    it('Gets help text', async function () {
        const {stdout} = await execFile(binFile, ['-h']);
        assert.match(stdout, /USAGE: /u);
    });
});
