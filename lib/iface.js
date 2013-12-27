var spawn = require('child_process').spawn;
var split = require('split');
var through = require('through');

module.exports = function (cb) {
    var interfaces = [];
    var exitCode;
    var pending = 2;
    
    var ps = spawn('iwconfig', []);
    ps.stdout.pipe(split()).pipe(through(write, finish));
    
    ps.on('exit', function (code) {
        exitCode = code;
        finish();
    });
    
    function write (line) {
        var m = /^(\S+)\s+IEEE 802\.11/.exec(line);
        if (m) interfaces.push(m[1]);
    }
    
    function finish () {
        if (--pending !== 0) return;
        if (exitCode !== 0) {
            cb(new Error('non-zero exit code in `iwconfig` command'));
        }
        else cb(null, interfaces);
    }
};
