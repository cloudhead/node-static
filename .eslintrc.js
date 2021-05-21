'use strict';

module.exports = {
    env: {
        es6: true,
        node: true
    },
    extends: ['eslint:recommended'],
    rules: {
        indent: ['error', 4],
        'no-var': ['error'],
        'no-unused-vars': ['error', {args: 'none'}],
        'prefer-const': ['error']
    }
};
