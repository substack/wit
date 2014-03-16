# wit

command-line linux wireless toolkit

This tool is a tiny wrapper around the `iw` and `wpa_supplicant` commands to
make wireless networking from the command line simple and pleasant.

# usage

```
wit

  Automatically connect to an accessible network,
  launching wpa_supplicant as necessary.

win connect ESSID

  Connect to a particular ESSID.
  If ESSID is surrounded in (//)s, connect to the first matching result.

wit list

  List all wireless signals.

wit search TERMS...

  Search the known network list by SSID, printing the SSID and password.

  If TERMS is empty, print all the SSIDs.
  If TERMS is guarded in //s, treat the search as a regex.

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
