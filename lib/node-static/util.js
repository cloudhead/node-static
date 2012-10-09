var fs = require('fs'),
    path = require('path'),
    less = require('less');

this.mstat = function (dir, files, callback) {
    (function mstat(files, stats) {
        var file = files.shift();

        if (file) {
            fs.stat(path.join(dir, file), function (e, stat) {
                if (e) {
                    callback(e);
                } else {
                    mstat(files, stats.concat([stat]));
                }
            });
        } else {
            callback(null, {
                size: stats.reduce(function (total, stat) {
                    return total + stat.size;
                }, 0),
                mtime: stats.reduce(function (latest, stat) {
                    return latest > stat.mtime ? latest : stat.mtime;
                }, 0),
                ino: stats.reduce(function (total, stat) {
                    return total + stat.ino;
                }, 0)
            });
        }
    })(files.slice(0), []);
};

this.compileLess = function (source, target, callback) {
    fs.readFile(source, 'utf8', function (e, data) {
        if (e) {
            return callback(e);
        }
        
        less.render(data, {compress: true}, function (e, css) {
            if (e) {
                return callback(e);
            }
            
            fs.writeFile(target, css, function (e) {
                if (e) {
                    return callback(e);
                }
                
                callback(null);
            });
        });
    });
};
