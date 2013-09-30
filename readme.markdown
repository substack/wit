# wit

command-line linux wireless toolkit

# 

Connecting to 802.11 wireless access points on the command line is not very
complicated once you can figure out how to turn off all the default services
that get in your way and make everything difficult.

This tool is a tiny wrapper around the `iw` and `wpa_supplicant` commands to
make wireless networking from the command line simple and pleasant.

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

