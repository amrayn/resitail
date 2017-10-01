<p align="center">
  ﷽
</p>

# Overview
You can use resitail to stream residue logs on your browser.

Some parts of resitail uses code from [frontail](https://github.com/mthenw/frontail)

[![Version](https://img.shields.io/npm/v/resitail.svg)](https://www.npmjs.com/package/resitail)
[![GitHub license](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://github.com/muflihun/resitail/blob/master/LICENSE)
[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.me/MuflihunDotCom/25)

## Quick start

- `npm i resitail -g`
- `sudo resitail --config <residue_config> --port <port, default: 3000>`
- visit [http://127.0.0.1:3000](http://127.0.0.1:3000)

Notice the `sudo`, this is because all the files written by residue server will need sudo access as they may be owned by one user or the other with limited permissions. We need to be able to read all of these log files.

## Installation

    npm i resitail -g
    
Web interface runs on **http://127.0.0.1:[port]**

## Features
Currently, resitail is very limited to the following features:
 * Simple tailing using basic filters ([`clientId`](http://residue-demo.muflihun.com/?clientId=muflihun00102030), [`loggerId`](http://residue-demo.muflihun.com/?clientId=muflihun00102030&loggerId=default) and [`levels`](http://residue-demo.muflihun.com/?clientId=muflihun00102030&loggerId=sample-app&levels=info))
 
Resitail aims to provide (but not limited to):
* Server:
   - Fully featured log streaming on browser
   - Optional HTTPS support
   - Optional basic authentication
   - Login functionality to keep track of user-clients map so that user can login using their own credentials and display list of clients, loggers and logging levels
* Web Interface
   - Filters and searching for logs
   - Highlighting logs using specific patterns (preset patterns and user-provided patterns)
   - Download file/s or part of file (specified lines)
   - We are happy to integrate other similar software (e.g, [kibana](https://www.elastic.co/products/kibana)) as they are much mature and actively developed, as long as they can: parse residue configurations, query residue server using admin requests and tail specific log files for specific users

## Contribution
Please feel free to create pull requests.

## License
```
Copyright 2017 Muflihun Labs

https://github.com/muflihun/
https://muflihun.com
https://muflihun.github.io

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
