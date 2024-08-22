/**
 * @param {object} config
 * @param {string} config.input
 * @returns {RollupConfig}
 */
function getRollupObject ({input} = {}) {
    return {
        external: ['fs', 'events', 'http', 'path', 'mime', 'minimatch'],
        input,
        output: {
            format: 'cjs',
            file: input.replace(/^.\/lib\//u, './dist/').replace(/\.js$/u, '.cjs')
        }
    };
}

export default [
    getRollupObject({
        input: './lib/node-static.js', minifying: true
    })
];
