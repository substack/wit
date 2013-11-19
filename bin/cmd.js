#!/usr/bin/env node
var argv = require('optimist').argv;
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var concat = require('concat-stream');
//var tmenu = require('terminal-menu');

if (argv._[0] === 'start') {
    var args = [ '-l', '^(wpa_supplicant|dhclient)' ];
    exec('pgrep ' + args.join(' '), function (err, stdout) {
        if (stdout.length > 2) {
            console.error(
                'WARNING: these processes are already already running:\n'
                + stdout.split('\n')
                    .map(function (line) { return '  ' + line })
                    .join('\n')
                + '\nProbably nothing will work while those processes are'
                + ' running.'
            );
        }
        var args = [ '-i', 'wlan2', '-c', '/etc/wpa_supplicant.conf' ];
        spawn('wpa_supplicant', args, { stdio: 'inherit' });
        spawn('dhclient', [ 'wlan2', '-r' ]).on('exit', function () {
            spawn('dhclient', [ 'wlan2', '-d' ], { stdio: 'inherit' });
        });
    });
    return;
}
if (argv._[0] === 'add') {
    if (argv._.length < 3) {
        console.error('usage: wit add SSID PASSPHRASE');
        return process.exit(1);
    }
    spawn('wpa_passphrase', argv._[1], argv._[2])
        .pipe(concat(function (body) {
            
        }))
    ;
    return;
}

var table = require('text-table');

var iwlist = require('../lib/list.js');
iwlist(function (err, rows) {
    if (err) return console.error(err);
    console.log(table(rows));
});
