'use strict';

module.exports = {
    reject: [
        // Vulnerability in higher versions
        'colors',

        // ESM-only; only switch when dropping dual CJS support
        'node-fetch'
    ]
};
