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

function BrowserHook(config, serverInfo) {

    this.config = config;
    this.serverInfo = serverInfo;

    const validFiles = ['/index.html', '/style.css', '/app.js', '/favicon.ico'];

    const handler = (req, res) => {
        let url = req.url;
        if (url === '/' || url === '') {
            url = '/index.html';
        }
        for (var i = 0; i < validFiles.length; ++i) {
            if (url.indexOf(validFiles[i]) > -1) {
                url = validFiles[i];
                break;
            }
        }
        const fullFile = __dirname + url;
        if (!fs.existsSync(fullFile)) {
            res.writeHead(404);
            return res.end('File does not exist');
        }
        if (validFiles.indexOf(url) === -1) {
            res.writeHead(401);
            return res.end('Access Denied');
        }
        fs.readFile(fullFile, (err, data) => {
            if (err) {
                res.writeHead(500);
                return res.end(`Error loading ${req.url} - correct permissions?`);
            }

            res.writeHead(200);
            res.end(data);
        });
    }

    let app = require('http').createServer(handler)
    let io = require('socket.io').listen(app)
    app.listen(config.port);

    const clients = [];
    
    const thisRef = this;

    io.sockets.on('connection', (socket) => {
        socket.on('client-ready', function() {
            clients.push({
                socket: socket.id,
                ignore_clients_list: [],
                ignore_loggers_list: [],
            });
            socket.emit("server-info", thisRef.serverInfo);
        });

        socket.on('stop-client', function(data) {
            for (var i = 0; i < clients.length; ++i) {
                if (clients[i].socket === socket.id) {
                    if (clients[i].ignore_clients_list.indexOf(data.id) === -1) {
                        clients[i].ignore_clients_list.push(data.id);
                    }
                    break;
                }
            }
        });

        socket.on('stop-logger', function(data) {
            for (var i = 0; i < clients.length; ++i) {
                if (clients[i].socket === socket.id) {
                    if (clients[i].ignore_loggers_list.indexOf(data.id) === -1) {
                        clients[i].ignore_loggers_list.push(data.id);
                    }
                    break;
                }
            }
        });

        socket.on('start-client', function(data) {
            for (var i = 0; i < clients.length; ++i) {
                if (clients[i].socket === socket.id) {
                    const idx = clients[i].ignore_clients_list.indexOf(data.id);
                    if (idx !== -1) {
                        clients[i].ignore_clients_list.splice(idx, 1);
                    }
                    break;
                }
            }
        });

        socket.on('start-logger', function(data) {
            for (var i = 0; i < clients.length; ++i) {
                if (clients[i].socket === socket.id) {
                    const idx = clients[i].ignore_loggers_list.indexOf(data.id);
                    if (idx !== -1) {
                        clients[i].ignore_loggers_list.splice(idx, 1);
                    }
                    break;
                }
            }
        });

        socket.on('disconnect', function() {
            for (var i = 0; i < clients.length; ++i) {
                if (clients[i].socket === socket.id) {
                    clients.splice(i, 1);
                    break;
                }
            }
        });
    });

    this.send = (data) => {
        const loggerId = data.logger_id || data.channel_name;
        const clientId = data.client_id || data.channel_name;

        for (var i = 0; i < clients.length; ++i) {
            if (clients[i].ignore_loggers_list.indexOf(loggerId) === -1 &&
                clients[i].ignore_clients_list.indexOf(clientId) === -1) {
                io.sockets.connected[clients[i].socket].emit("data", data);
            }
        }
    }

}

module.exports = (config, serverInfo) => new BrowserHook(config, serverInfo);