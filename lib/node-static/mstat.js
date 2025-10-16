import fs from 'fs';
import path from 'path';

/**
 * @typedef {{
 *   size: number,
 *   mtime: Date,
 *   ino: number
 * }} StatInfo
 */

/**
 * @param {string} dir
 * @param {string[]} files
 * @param {(errOrNull: NodeJS.ErrnoException|null, result?: StatInfo) => void} callback
 */
function mstat (dir, files, callback) {
    (function mstat(files, stats) {
        const file = files.shift();

        if (file) {
            try {
                fs.stat(path.join(dir, file), function (e, stat) {
                    if (e) {
                        callback(e);
                    } else {
                        mstat(files, stats.concat(stat));
                    }
                });
            } catch (e) {
                callback(/** @type {NodeJS.ErrnoException} */ (e));
            }
        } else {
            callback(null, {
                size: stats.reduce((total, stat) => {
                    return total + stat.size;
                }, 0),
                mtime: stats.reduce((latest, stat) => {
                    return latest > stat.mtime ? latest : stat.mtime;
                }, new Date(-8640000000000000)),
                ino: stats.reduce((total, stat) => {
                    return total + stat.ino;
                }, 0)
            });
        }
    })(files.slice(0), /** @type {fs.Stats[]} */ ([]));
}

export {mstat};
