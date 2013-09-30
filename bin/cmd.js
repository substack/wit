#!/usr/bin/env node
//var createMenu = require('terminal-menu');
var table = require('text-table');
var fs = require('fs');
var known = fs.readFileSync('/etc/wpa_supplicant.conf', 'utf8')
    .split('\n').reduce(function (acc, line) {
        var m;
        if (m = /^\s*ssid="([^"]*)"/.exec(line)) {
            acc.current = m[1]
        }
        if (m = /^\s*psk=(\S+)/.exec(line)) {
            acc.networks[acc.current] = true;
        }
        return acc;
    }, { current: {}, networks: {} }).networks
;

var iwscan = require('../lib/scan.js');
iwscan(function (err, signals) {
    if (err) return console.error(err);
    
    var rows = Object.keys(signals).sort(cmp).map(function (key) {
        var sig = signals[key];
        
        var enc = (function (e) {
            if (!e) return 'FREE';
            if (e.WPA || e.RSN) return 'WPA';
            if (e['Group cipher']) return 'WPA'; // e['Group cipher']._value;
            return '???';
        })(sig['HT operation'] || sig.RSN);
        
        if (enc !== 'FREE' && known[sig.SSID]) enc += '*';
        
        return [ sig.SSID, sig.signal, enc ];
    });
    console.log(table(rows));
    
    function cmp (a, b) {
        return a.SSID < b.SSID ? -1 : 1;
    }
    
    /*
    var menu = createMenu({ width: 70, x: 2, y: 2 });
    menu.reset();
    menu.write('WIRELESS SIGNALS');
    menu.write('----------------------------------');
    
    Object.keys(signals).forEach(function (ap) {
        menu.add(signals[ap].SSID + ' ' + ap);
    });
    menu.add('EXIT');
    
    menu.on('select', function (label) {
        menu.close();
    });
    
    menu.createStream().pipe(process.stdout);
    */
});
