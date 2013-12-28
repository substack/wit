# wit

command-line linux wireless toolkit

This tool is a tiny wrapper around the `iw` and `wpa_supplicant` commands to
make wireless networking from the command line simple and pleasant.

# usage

```
wit

  Automatically connect to an accessible network.

wit list

  List all wireless signals.

wit add SSID

  Add a preferred open network.

wit add SSID PASSPHRASE

  Add a WPA network with a PASSPHRASE.

```

# installing

The main thing you will need to do is turn off whatever horrible default
networking stack is already running.

## debian/ubuntu

```
# update-rc.d network-manager remove
# service network-manager stop
```

Now to import all your existing passphrases, use the `wit-import` command:

```
# wit-import > /etc/wpa_supplicant.conf
```

# license

MIT
