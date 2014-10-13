#!/usr/bin/env node
var minimist = require('minimist');
var argv = minimist(process.argv.slice(2), {
    'alias': {
        'i': [ 'interface', 'iface' ],
        'h': 'help'
    },
    'boolean': [ 'h' ],
    'string': [ '_' ]
});

var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var concat = require('concat-stream');
var table = require('text-table');

var getIface = require('../lib/iface.js');
var iwscan = require('../lib/scan.js');
var known = require('../lib/known.js');

var mkdirp = require('mkdirp');
var fs = require('fs');
var path = require('path');

if (argv.h || argv.help) return usage();

var HOME = process.env.HOME || process.env.USERDIR;
var configDir = path.join(HOME, '.config', 'wit');

try { var networks = require(path.join(configDir, 'networks.json')) }
catch (e) { networks = [] }

var preferred = networks.map(function (n) { return n.ssid })
    .concat(Object.keys(known))
;

function accessible (sig) {
    return encType(sig) === 'FREE' || known[sig.ssid]
        || preferred.indexOf(sig.ssid) >= 0
    ;
}

if (argv._[0] === 'list') {
    getSorted(function (err, iface, available, notAvailable) {
        if (err) return console.error(err);
        
        console.log(table(available.map(fmt)));
        console.log(Array(51).join('-'));
        console.log(table(notAvailable.map(fmt)));
        
        function fmt (r) {
            return [ r.ssid, r.signal, r['last seen'], encType(r) ].map(String);
        }
    });
    return;
}
var connected = false, wpa;
if (argv._.length === 0 || argv._[0] === 'auto'
|| argv._[0] === 'connect') return (function retry () {
    var addr = argv._[0] === 'connect' ? argv._[1] : null;
    var m = /^\/(.+)\/(\w*)$/.exec(addr);
    if (m) addr = RegExp(m[1], m[2]);
    
    var pending = 2;
    checkRunning(function (running) { if (!running) next() })
    
    var iface, available, notAvailable;
    getSorted(function (err, a, b, c) {
        if (err) return console.error(err);
        iface = a, available = b, notAvailable = c;
        next();
    });
    
    function next () {
        if (--pending !== 0) return;
        
        if (available.length === 0) {
            console.error('NO AVAILABLE SIGNALS');
            return retry();
        }
        var index = 0;
        if (addr) {
            for (; index < available.length; index++) {
                var ssid = available[index].ssid;
                if (addr === ssid) break;
                if (addr.test && addr.test(ssid)) break;
            }
            if (index === available.length) {
                console.log(addr + ' NOT AVAILABLE');
                return retry();
            }
        }
        
        console.log('CONNECTING TO', available[index].ssid);
        
        if (known[available[index].ssid]) {
            if (!wpa) {
                var args = [ '-i', iface, '-c', '/etc/wpa_supplicant.conf' ];
                var wps = spawn('wpa_supplicant', args);
                wpa = true;
                wps.stdout.pipe(process.stderr);
                wps.stderr.pipe(process.stderr);
                var ondata = function (buf) {
                    if (/CTRL-EVENT-CONNECTED/.test(buf)) connected = true;
                    if (/CTRL-EVENT-DISCONNECTED/.test(buf)) {
                        connected = false;
                        retry();
                    }
                };
                wps.stdout.on('data', ondata);
                wps.stderr.on('data', ondata);
            }
        }
        else if (encType(available[index]) !== 'FREE'
        && preferred.indexOf(available[index].ssid) < 0) {
            return retry();
        }
        
        var attempts = 0;
        spawn('iw', [ 'dev', iface, 'disconnect' ])
            .on('exit', function () {
                setTimeout(ondisconnect, 1000);
            })
        ;
        
        function ondisconnect () {
            if (++ attempts === 5) return retry();
            
            var ssid = available[index].ssid;
            var ps = spawn('iw',
                [ 'dev', iface, 'connect', '-w', ssid ]
            );
            ps.stdout.pipe(process.stdout);
            ps.stderr.pipe(process.stderr);
            var data = '';
            ps.stdout.on('data', function (buf) { data += buf });
            ps.stderr.on('data', function (buf) { data += buf });
            
            ps.on('exit', function (code) {
                if (code !== 0 && !connected) return ondisconnect();
                dhclient();
            });
        }
        
        function dhclient () {
            spawn('dhclient', [ iface, '-r' ]).on('exit', function () {
                spawn('dhclient', [ iface, '-d' ], { stdio: 'inherit' });
            });
        }
    }
})();

if (argv._[0] === 'add') {
    if (argv._.length === 2) {
        mkdirp.sync(configDir);
        
        networks.push({ ssid: argv._[1] });
        fs.writeFile(
            path.join(configDir, 'networks.json'),
            JSON.stringify(networks),
            function (err) {
                if (err) console.error(err)
            }
        );
        return;
    }
    if (argv._.length < 3) {
        console.error('usage:');
        console.error('  wit add SSID');
        console.error('  wit add SSID PASSPHRASE');
        return process.exit(1);
    }
    var ps = spawn('wpa_passphrase', [ argv._[1], argv._[2] ]);
    ps.stderr.pipe(process.stderr);
    ps.stdout.pipe(
        fs.createWriteStream('/etc/wpa_supplicant.conf', { flags: 'a' })
    );
    return;
}

if (argv._[0] === 'search') {
    var terms = argv._.slice(1).join(' ');
    if (/^\//.test(terms) && /\/\w*$/.test(terms)) {
        var flags = terms.split('/').slice(-1)[0] || 'i';
        terms = RegExp(terms.replace(/^\/|\/\w*$/g, ''), flags);
    }
    Object.keys(known).forEach(function (key) {
        if (terms.test && terms.test(key)) {
            console.log(key, '=>', known[key]);
        }
        else if (terms.toLowerCase
        && key.toLowerCase().indexOf(terms.toLowerCase()) >= 0) {
            console.log(key, '=>', known[key]);
        }
    });
    return;
}

return usage(1);

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

function checkRunning (cb) {
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
            cb(true);
        }
        else if (cb) cb(false);
    });
}

function getSorted (cb) {
    getInterface(function (iface) {
        iwscan(iface, function (err, rows) {
            if (err) return cb(err);
            
            var sorted = Object.keys(rows)
                .map(function (key) { return rows[key] })
                .sort(cmp)
            ;
            var available = sorted.filter(accessible);
            var notAvailable = sorted.filter(function (s) {
                return !accessible(s);
            });
            cb(null, iface, available, notAvailable);
            
            function cmp (a, b) {
                var pa = preferred.indexOf(a.ssid) >= 0;
                var pb = preferred.indexOf(b.ssid) >= 0;
                if (pa ^ pb) return pa ? -1 : 1;
                
                var sa = parseFloat(a.signal);
                var sb = parseFloat(b.signal);
                
                var la = parseInt(a['last seen']);
                var lb = parseInt(b['last seen']);
                
                return sa < sb ? 1 : -1;
            }
        });
    });
}

function encType (r) {
    if (r.wpa || r.rsn) return 'WPA';
    if (r['ht operation']) return '???';
    return 'FREE';
}

function usage (code) {
    var rs = fs.createReadStream(__dirname + '/usage.txt');
    rs.pipe(process.stdout);
    if (code !== undefined) {
        rs.on('end', function () { process.exit(code) });
    }
}
