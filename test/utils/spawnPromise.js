import {spawn} from 'child_process';

/**
* @callback EventWatcher
* @param {string} stdout Aggregate stdout
* @param {string} data
* @returns {void|Promise<void>}
*/

/**
 * Control expiration of spawn with a user timeout
 * @param {string} path
 * @param {PlainObject|string[]} [opts]
 * @param {string[]} args
 * @param {Integer} [killDelay=10000]
 * @param {EventWatcher} watchEvents
 * @returns {Promise<SpawnResults>}
 */
const spawnPromise = (
    path, opts, args, killDelay, watchEvents = null
) => {
    if (Array.isArray(opts)) {
        watchEvents = killDelay;
        killDelay = args;
        args = opts;
        opts = undefined;
    }
    if (!killDelay) {
        killDelay = 10000;
    }

    return new Promise((resolve, reject) => {
        let stderr = '', stdout = '';
        const cli = spawn(
            path,
            args,
            opts
        );
        cli.stdout.on('data', (data) => {
            stdout += data;
            if (watchEvents) {
                watchEvents(stdout, data);
            }
        });

        cli.stderr.on('data', (data) => {
            stderr += data;
        });

        cli.on('error', (data) => {
            const err = new Error(data);
            reject(err);
        });

        cli.on('close', (code) => {
            resolve({
                stdout,
                stderr
            });
        });
        // Todo: We should really just signal this when we know the server
        //    is running
        setTimeout(() => {
            cli.kill();
        }, killDelay);
    });
};

const spawnConditional = async (
    binFile, opts, args, killDelay, awaitInfo
) => {
    if (Array.isArray(opts)) {
        awaitInfo = killDelay;
        killDelay = args;
        args = opts;
        opts = undefined;
    }
    const {
        condition,
        action: actionCallback,
        error: errBack
    } = awaitInfo;

    let awaiting;
    let cliProm;
    const response = await new Promise((resolve, reject) => {
        cliProm = spawnPromise(binFile, opts, args, killDelay, async (stdout) => {
            if (awaiting || typeof condition === 'string'
                ? !stdout.includes(condition)
                : 'exec' in condition && 'test' in condition
                    ? !condition.test(stdout)
                    : condition(stdout)
            ) {
                return;
            }
            awaiting = true;
            try {
                const resp = await actionCallback();
                resolve(resp);
            } catch (err) {
                reject(err);
            }
        });
    });
    const {stderr, stdout} = await cliProm;
    if (stderr) {
        errBack(new Error(stderr));
        return;
    }
    return {response, stdout};
};

export {spawnPromise, spawnConditional};
