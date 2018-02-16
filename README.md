<p align="center">
  ﷽
</p>

# Overview
Resitail is a tool that streams your [residue](https://github.com/muflihun/residue) logs using hooks. 

Samples directory contain fully functional [slack](https://slack.com/) webhook.

[![Version](https://img.shields.io/npm/v/resitail.svg)](https://www.npmjs.com/package/resitail)
[![Apache 2.0 license](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://github.com/muflihun/resitail/blob/master/LICENSE)
[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.me/MuflihunDotCom/25)

## Quick start

- `npm install -g resitail`
- `sudo resitail --config <config>`

Notice the `sudo`, this is because all the files written by residue server will need sudo access as they may be owned by one user or another with limited permissions. Resitail needs to be able to read all of these log files.

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
