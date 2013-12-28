var fs = require('fs');
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
module.exports = known;
