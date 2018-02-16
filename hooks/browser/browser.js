//
//  browser.js
//  A simple browser resitail hook that streams logs to the browser
//
//  Resitail
//
//  Copyright 2017-present Muflihun Labs
//
//  Author: @abumusamq
//
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.
//

"use strict";

const fs = require('fs');

function BrowserHook(config) {
    
    this.config = config;

    const handler = (req, res) => {
        fs.readFile(__dirname + '/index.html', (err, data) => {
            if (err) {
                res.writeHead(500);
                return res.end('Error loading index.html - correct permissions?');
            }

            res.writeHead(200);
            res.end(data);
        });
    }
    
    let app = require('http').createServer(handler)
    let io = require('socket.io').listen(app)
    app.listen(config.port);

    const clients = [];

    io.sockets.on('connection', (socket) => {
        socket.on('client-ready', function() {
            clients.push(socket.id);
        });

        socket.on('disconnect', function() {
            for (var i = 0; i < clients.length; ++i) {
                if (clients[i] === socket.id) {
                    delete clients[i];
                    break;
                }
            }
        });
    });
    
    this.send = (data) => {
        for (var i = 0; i < clients.length; ++i) {
            if (clients[i]) {
                io.sockets.connected[clients[i]].emit("data", data);
            } else {
                clients.splice(i, 1);
            }
        }
    }

}

module.exports = (config) => new BrowserHook(config);
