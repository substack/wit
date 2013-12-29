var through = require('through');
var combine = require('stream-combiner');
var split = require('split');

module.exports = function (cb) {
    var signals = {};
    var current = [], prev;
    
    return combine(split(), through(write, end));
    
    function write (buf) {
        var line = buf.toString('utf8');
        var level = /^(\s*)/.exec(line)[1].length;
        
        if (/^BSS\s/.test(line)) {
            var mac = line.split(/\s+/)[1];
            signals[mac] = {
                associated: /-- associated$/.test(line)
            };
            current = [ signals[mac] ];
            return;
        }
        
        if (level > current.length) {
            current.push({ _key: prev.key, _value: prev.value });
        }
        else if (level < current.length) {
            var c = current.pop();
            if (current.length) {
                current[current.length - 1][c._key] = c;
            }
        }
        
        var m = /^\s+([^:]+):\s*(.*)/.exec(line);
        if (!m) return;
        
        var key = m[1].replace(/^\*\s*/, '').toLowerCase();
        var value = m[2].replace(/^\*\s*/, '');
        
        if (current.length) {
            current[current.length - 1][key] = value;
        }
        prev = { key: key, value: value };
    }
    
    function end () {
        cb(null, signals);
    }
};
