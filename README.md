<p align="center">
  ﷽
</p>

# Overview
You can use resitail to stream residue logs on your browser.

resitail is forked from [frontail](https://github.com/mthenw/frontail) (MIT) to suit the needs.

[ **Currently under development** ]

[![Build Status](https://img.shields.io/travis/muflihun/resitail.svg?style=flat)](https://travis-ci.org/muflihun/resitail)
[![Version](https://img.shields.io/npm/v/resitail.svg)](https://www.npmjs.com/package/resitail)
[![GitHub license](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://github.com/muflihun/resitail/blob/master/LICENSE)
[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.me/MuflihunDotCom/25)

## Quick start

- `npm i resitail -g`
- `resitail /var/log/residue.log`
- visit [http://127.0.0.1:9001](http://127.0.0.1:9001)

## Features

* log rotation
* auto-scrolling
* marking logs
* number of unread logs in favicon
* themes (default, dark)
* [highlighting](#highlighting)
* search (```Tab``` to focus, ```Esc``` to clear)
* tailing [multiple files](#tailing-multiple-files) and [stdin](#stdin)
* basic authentication

## Installation

    npm i resitail -g
    
## Usage

    resitail [options] [file ...]

    Options:

      -h, --help                    output usage information
      -V, --version                 output the version number
      -h, --host <host>             listening host, default 0.0.0.0
      -p, --port <port>             listening port, default 9001
      -n, --number <number>         starting lines number, default 10
      -l, --lines <lines>           number on lines stored in browser, default 2000
      -t, --theme <theme>           name of the theme (default, dark)
      -d, --daemonize               run as daemon
      -U, --user <username>         Basic Authentication username, option works only along with -P option
      -P, --password <password>     Basic Authentication password, option works only along with -U option
      -k, --key <key.pem>           Private Key for HTTPS, option works only along with -c option
      -c, --certificate <cert.pem>  Certificate for HTTPS, option works only along with -k option
      --pid-path <path>             if run as daemon file that will store the process id, default /var/run/resitail.pid
      --log-path <path>             if run as daemon file that will be used as a log, default /dev/null
      --ui-hide-topbar              hide topbar (log file name and search box)
      --ui-no-indent                don't indent log lines
      --ui-highlight                highlight words or lines if defined string found in logs, default preset
      --ui-highlight-preset <path>  custom preset for highlighting (see ./preset/default.json)

Web interface runs on **http://127.0.0.1:[port]**.

### Tailing multiple files

`[file ...]` accepts multiple paths, `*`, `?` and other shell special characters([Wildcards, Quotes, Back Quotes and Apostrophes in shell commands](http://www.codecoffee.com/tipsforlinux/articles/26-1.html)).

### stdin

Use `-` for streaming stdin:

    ./server | resitail -

### Highlighting

```--ui-highlight``` option turns on highlighting in UI. By default preset from ```./preset/defatult.json``` is used:

```
{
    "words": {
        "err": "color: red;"
    },
    "lines": {
        "err": "font-weight: bold;"
    }
}
```

which means that every "err" string will be in red and every line containing "err" will be bolded.