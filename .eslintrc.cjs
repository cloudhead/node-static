'use strict';

module.exports = {
    env: {
        es6: true,
        node: true
    },
    parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2021
    },
    extends: ['eslint:recommended'],
    overrides: [
        {
            files: 'test/**',
            env: {
                mocha: true
            }
        }
    ],
    rules: {
        indent: ['error', 4],
        'no-var': ['error'],
        'no-unused-vars': ['error', {args: 'none'}],
        'prefer-const': ['error']
    }
};
