var spawn = require('child_process').spawn;
var parser = require('./parse_scan.js');

module.exports = function (iface, cb) {
    spawn('ifconfig', [ iface, 'up' ]).on('exit', function () {
    
        var ps = spawn('iw', [ 'dev', iface, 'scan' ]);
        ps.on('exit', function (code) {
            if (code !== 0) cb(new Error('non-zero exit code running iw scan'));
            cb = function () {};
        });
        ps.stdout.pipe(parser(cb));
    });
};
