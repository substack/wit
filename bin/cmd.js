#!/usr/bin/env node
var minimist = require('minimist');
var argv = minimist(process.argv.slice(2), {
    'alias': { 'i': [ 'interface', 'iface' ] }
});

var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var concat = require('concat-stream');
var table = require('text-table');
var getIface = require('../lib/iface.js');

//var tmenu = require('terminal-menu');

if (argv._.length === 0 || argv._[0] === 'auto') {
    getInterface(function (iface) {
        console.log(iface);
    });
}
if (argv._[0] === 'start') {
    var args = [ '-l', '^(wpa_supplicant|dhclient)' ];
    getInterface(function (iface) {
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
            var args = [ '-i', iface, '-c', '/etc/wpa_supplicant.conf' ];
            spawn('wpa_supplicant', args, { stdio: 'inherit' });
            spawn('dhclient', [ iface, '-r' ]).on('exit', function () {
                spawn('dhclient', [ iface, '-d' ], { stdio: 'inherit' });
            });
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

if (argv._[0] === 'select') {
    var iwlist = require('../lib/list.js');
    iwlist(function (err, rows) {
        if (err) return console.error(err);
        console.log(table(rows));
    });
}

function getInterface (cb) {
    if (argv.i) return process.nextTick(function () { cb(argv.i) });
    
    getIface(function (err, ifaces) {
        if (err) {
            console.error(err);
        }
        else if (ifaces.length > 1) {
            console.error(
                'Too many interfaces. Disambiguate with -i:\n\n'
                + ifaces.map(function (s) { return '  ' + s }).join('\n')
                + '\n'
            );
        }
        else if (ifaces.length === 0) {
            console.error(
                'No interfaces found.'
                + ' Use -i to select an interface manually'
            );
        }
        else cb(ifaces[0]);
    });
}
