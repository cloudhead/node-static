import js from '@eslint/js';
import globals from 'globals';

export default [
    {
        ignores: ['dist']
    },
    js.configs.recommended,
    {
        languageOptions: {
            globals: globals.node,
            parserOptions: {
                sourceType: 'module',
                ecmaVersion: 2021
            }
        },
        rules: {
            indent: ['error', 4],
            'no-var': ['error'],
            'no-unused-vars': ['error', {args: 'none'}],
            'prefer-const': ['error']
        }
    },
    {
        files: ['test/**'],
        languageOptions: {
            globals: globals.mocha
        }
    }
];
