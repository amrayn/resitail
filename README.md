<p align="center">
  ﷽
</p>

# Overview
Resitail is a tool that streams your [residue](https://github.com/muflihun/residue) logs using hooks. 

[![Version](https://img.shields.io/npm/v/resitail.svg)](https://www.npmjs.com/package/resitail)
[![Apache 2.0 license](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://github.com/muflihun/resitail/blob/master/LICENSE)
[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.me/MuflihunDotCom/25)

## Quick start

- `npm install -g resitail`
- `sudo resitail --config <config>`

Notice the `sudo`, this is because all the files written by residue server will need sudo access as they may be owned by one user or another with limited permissions. Resitail needs to be able to read all of these log files.

## Configuration
A configuration file looks like:

```
{
    "residue_config" : "<residue-config>",
    "hooks": [
    ... <see Connecting Hooks section below>
    ]
}
```

## Creating Hook
Hook is essentially a JS module with following minimal requirements

 * A class with constructor: `config` and `serverInfo`
 * A send function with `data` parameter.
 * Export this class
 
Once connected resitail will use this `send` function to send the logs

Example:

```javascript
"use strict";

function sampleHook (config, serverInfo) {
    this.config = config;
    this.serverInfo = serverInfo;
}

sampleHook.prototype.send = (data) => {
    console.log(data);
}

module.exports = (config, serverInfo) => new sampleHook(config, serverInfo);
```

Data contains following properties:

 | Property | Description |
 |----------|-------------|
 | `event`  | Event name (i.e, `resitail:line`, `resitail:err`) |
 | `event_type` | Type of event (i.e, `info`, `error`) |
 | `line` | Contents of event (either log line or error details etc) |
 | `channel` | Type of channel (i.e, `client` or `logger`)|
 | `channel_name` | Name of channel (i.e, `client_id` or `logger_id`) |
 | `logger_id` | Logger ID if channel is `client`|
 | `client_id` | Client ID if channel is `logger`|

## Connecting Hook
Once hook is ready you can connect it by adding it to configuration.

```
{
    "name": "<hook name>",
    <path or package>
    "enabled": false,
    "config": {
        "channels" : {
            "to_client" : true,
            "to_logger" : true
        }
        ... more configs specific to hook
    }
}
```

A fully working hook configuration looks like:

From registry:

```
{
    "name": "browser",
    "package": "resitail-browser",
    "version": "latest"
    "enabled": true,
    "config": {
        "channels" : {
            "to_client" : true,
            "to_logger" : true
        }
        port: 3000
    }
}
```

This will install the package globally.

Local:

```
{
    "name": "browser",
    "path": "../resitail-browser",
    "enabled": true,
    "config": {
        "channels" : {
            "to_client" : true,
            "to_logger" : true
        }
        port: 3000
    }
}
```

## Notes
 * Please [search for resitail-hook on NPM](https://www.npmjs.com/browse/keyword/resitail-hook) for available hooks
 * Please [check out sample hook](https://github.com/muflihun/resitail-browser) to get started

## License
```
Copyright 2017-present Muflihun Labs
Copyright 2017-present @abumusamq

https://github.com/muflihun/
https://muflihun.com/
https://muflihun.github.io/

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
