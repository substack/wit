var fs = require('fs');

var known = fs.readFileSync('/etc/wpa_supplicant.conf', 'utf8')
    .split('\n').reduce(function (acc, line) {
        var m;
        if (m = /^\s*ssid="([^"]*)"/.exec(line)) {
            acc.current = m[1];
        }
        else if (m = /^\s*psk=(\S+)/.exec(line)) {
            if (!acc.networks[acc.current]) {
                acc.networks[acc.current] = true;
            }
        }
        else if (m = /^\s*#psk="([^"]*)"/.exec(line)) {
            acc.networks[acc.current] = m[1];
        }
        return acc;
    }, { current: {}, networks: {} }).networks
;
module.exports = known;
