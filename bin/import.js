#!/usr/bin/env node
var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;
var concat = require('concat-stream');

var dir = '/etc/NetworkManager/system-connections';
fs.readdir(dir, function (err, files) {
    if (err) return console.error(err);
    
    files.forEach(function (file) {
        fs.readFile(path.join(dir, file), 'utf8', function (err, src) {
            if (err) return console.error(err);
            
            var psk, ssid;
            
            var lines = src.split('\n');
            lines.forEach(function (line) {
                if (/^psk=/.test(line)) {
                    psk = line.replace(/^psk=/, '');
                }
                else if (/^ssid=/.test(line)) {
                    ssid = line.replace(/^ssid=/, '');
                }
            });
            
            if (ssid && psk) {
                var ps = spawn('wpa_passphrase', [ ssid, psk ]);
                ps.stdout.pipe(concat(function (body) {
                    process.stdout.write(body);
                }));
            }
        });
    });
});
