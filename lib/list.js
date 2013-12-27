var fs = require('fs');
var iwscan = require('../lib/scan.js');
var known = fs.readFileSync('/etc/wpa_supplicant.conf', 'utf8')
    .split('\n').reduce(function (acc, line) {
        var m;
        if (m = /^\s*ssid="([^"]*)"/.exec(line)) {
            acc.current = m[1];
        }
        if (m = /^\s*psk=(\S+)/.exec(line)) {
            acc.networks[acc.current] = true;
        }
        return acc;
    }, { current: {}, networks: {} }).networks
;

module.exports = function (iface, cb) {
    iwscan(iface, function (err, signals) {
        if (err) cb(err)
        else cb(null, mapSort(signals))
    });
};

function cmp (a, b) {
    return a.ssid < b.ssid ? -1 : 1;
}

function mapSort (signals) {
    return Object.keys(signals).sort(cmp).map(map);
    
    function map (key) {
        var sig = signals[key];
        
        var enc = (function () {
            if (sig.wpa || sig.rsn) return 'WPA';
            if (!sig['ht operation']) {
                return 'FREE';
            }
            return '???';
        })();
        
        if (enc !== 'FREE' && known[sig.ssid]) enc += '*';
        
        var ssid = sig.ssid;
        if (ssid.length > 30) ssid = ssid.slice(0, 30 - 3) + '...';
        return [ ssid, sig.signal, enc ];
    }
}
