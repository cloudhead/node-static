import {spawn} from 'child_process';

/**
 * @typedef {object} SpawnOptions
 */

/**
* @callback EventWatcher
* @param {string} stdout Aggregate stdout
* @param {string} data
* @returns {Promise<void>|void}
*/

/**
 * Control expiration of spawn with a user timeout
 * @overload
 * @param {string} path
 * @param {SpawnOptions} [opts] Spawn options
 * @param {string[]} [args]
 * @param {number} [killDelay]
 * @param {EventWatcher|null} [watchEvents]
 * @returns {Promise<{
 *   stdout: string,
 *   stderr: string
 * }|void>}
 */

/**
 * Control expiration of spawn with a user timeout
 * @overload
 * @param {string} path
 * @param {string[]} [args]
 * @param {number} [killDelay]
 * @param {EventWatcher|null} [watchEvents]
 * @returns {Promise<{
 *   stdout: string,
 *   stderr: string
 * }|void>}
 */

/**
 * Control expiration of spawn with a user timeout
 * @param {string} path
 * @param {SpawnOptions|string[]} [opts]
 * @param {string[]|number} [args]
 * @param {number|EventWatcher|null} [killDelay]
 * @param {EventWatcher|null} [watchEvents]
 */
const spawnPromise = (
    path, opts, args, killDelay, watchEvents = null
) => {
    if (Array.isArray(opts)) {
        watchEvents = /** @type {EventWatcher|null} */ (killDelay);
        killDelay = /** @type {number} */ (args);
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
            /** @type {string[]} */ (args),
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
            reject(data);
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
        }, /** @type {number} */ (killDelay));
    });
};

/**
 * @typedef {{
 *   condition: string|RegExp|((stdout: string) => boolean)
 *   action: () => void
 *   error?: (err: Error) => void
 * }} AwaitInfo
 */

/**
 * @overload
 * @param {string} binFile
 * @param {SpawnOptions} opts
 * @param {string[]} args
 * @param {number} killDelay
 * @param {AwaitInfo} awaitInfo
 * @returns {Promise<void|{
 *   response: Response|Response[],
 *   stdout: string
 * }>}
 */

/**
 * @overload
 * @param {string} binFile
 * @param {string[]} args
 * @param {number} killDelay
 * @param {AwaitInfo} awaitInfo
 * @returns {Promise<void|{
 *   response: Response|Response[],
 *   stdout: string
 * }>}
 */

/**
 * @param {string} binFile
 * @param {SpawnOptions|string[]|undefined} opts
 * @param {string[]|number} args
 * @param {number|AwaitInfo} killDelay
 * @param {AwaitInfo} awaitInfo
 */
const spawnConditional = async (
    binFile, opts, args, killDelay, awaitInfo
) => {
    if (Array.isArray(opts)) {
        awaitInfo = /** @type {AwaitInfo} */ (killDelay);
        killDelay = /** @type {number} */ (args);
        args = /** @type {string[]} */ (opts);
        opts = undefined;
    }
    const {
        condition,
        action: actionCallback,
        error: errBack
    } = awaitInfo;

    /** @type {boolean} */
    let awaiting;
    /**
     * @type {Promise<{
     *   stdout: string;
     *   stderr: string;
     * }|void>}
     */
    let cliProm;
    const response = await new Promise((resolve, reject) => {
        cliProm = spawnPromise(
            binFile,
            opts,
            /** @type {string[]} */
            (args),
            /** @type {number} */
            (killDelay),

            async (stdout) => {
                if (awaiting) {
                    return;
                }
                if (typeof condition === 'string'
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
            }
        );
    });
    // @ts-expect-error Ok
    const {stderr, stdout} = await cliProm;
    if (stderr && errBack) {
        errBack(new Error(stderr));
        return;
    }
    return {response, stdout};
};

export {spawnPromise, spawnConditional};
