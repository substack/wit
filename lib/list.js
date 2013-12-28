var iwscan = require('./scan.js');
var known = require('./known.js');

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
