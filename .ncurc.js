'use strict';

module.exports = {
    reject: [
        // Todo: mime@2 appears buggy with custom `define` (even after
        //   `lookup`->`getType`); would need to investigate, but preventing
        //   updates for now.
        'mime'
    ]
};
