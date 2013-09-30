var iface = 'wlan2';
var concat = require('concat-stream');

module.exports = function (cb) {
    var signals = {};
    return concat(function (body) {
        var lines = body.toString('utf8').split('\n');
        var index = 0;
        var current = [], prev;
        
        (function () {
            for (; index < lines.length; index++) {
                var line = lines[index];
                var level = /^(\s*)/.exec(line)[1].length;
                
                if (/^BSS\s/.test(line)) {
                    var mac = line.split(/\s+/)[1];
                    signals[mac] = {
                        associated: /-- associated$/.test(line)
                    };
                    current = [ signals[mac] ];
                    continue;
                }
                
                if (level > current.length) {
                    current.push({ _key: prev.key, _value: prev.value });
                }
                else if (level < current.length) {
                    var c = current.pop();
                    current[current.length - 1][c._key] = c;
                }
                
                var m = /^\s+([^:]+):\s*(.*)/.exec(line);
                if (!m) continue;
                
                var key = m[1].replace(/^\*\s*/, '');
                var value = m[2].replace(/^\*\s*/, '');
                
                current[current.length - 1][key] = value;
                prev = { key: key, value: value };
            }
        })();
        
        cb(signals);
    });
};
