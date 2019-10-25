<p align="center">
  ﷽
</p>

# Resitail

[![Version](https://img.shields.io/npm/v/resitail.svg)](https://www.npmjs.com/package/resitail)
[![Apache 2.0 license](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://github.com/amrayn/resitail/blob/master/LICENSE)

[![Donate](https://amrayn.github.io/donate.png?v2)](https://amrayn.com/donate)

Stream [residue](https://github.com/amrayn/residue) server logs via various hooks

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

 * A class with options constructor
 * A send function with `data` parameter.
 * Export this class

Once connected resitail will use this `send` function to send the logs

A most commonly used hook is [resitail-f](https://github.com/amrayn/resitail-f). It is even used in production servers for _muflihun.com_

Example:

```javascript
"use strict";

function sampleHook (options) {
    this.options = options;

    this.send = (data) => {
        console.log(data);
    }
}

module.exports = (options) => new sampleHook(options);
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

From registry (notice `package` and `version`):

```
{
    "name": "resitail-f",
    "package": "resitail-f",
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

Local (notice `path`):

```
{
    "name": "resitail-f",
    "path": "../resitail-f",
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
 * Please [check out sample hook](https://github.com/amrayn/resitail-f) to get started

## License
```
Copyright 2017-present Amrayn Web Services
Copyright 2017-present @abumusamq

https://github.com/amrayn/
https://muflihun.com/
https://amrayn.com

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
