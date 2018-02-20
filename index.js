//
//  index.js
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
const net = require('net');
const isEmpty = require('lodash.isempty');
const includes = require('lodash.includes');
const child_process = require('child_process');
const tail = require('./lib/tail');
const residue_crypt = require('./lib/residue_crypt');
const proc = require('./lib/option_parser');

proc.parse(process.argv);

if (proc.config === false) {
    console.error('ERR: No config file provided\nUsage: resitail --config <config>\n');
    process.exit();
}

const config = JSON.parse(fs.readFileSync(proc.config));

if (!config.residue_config) {
    console.error('Invalid configuration. Missing: residue_config');
    process.exit();
}

const residue_config = JSON.parse(fs.readFileSync(config.residue_config));
const crypt = residue_crypt(residue_config);
const packet_delimiter = '\r\n\r\n';


const hooks = [];

const serverInfo = {
    clients: [],
};

const recent_to_clients = [];
const recent_to_loggers = [];

for (let i = 0; i < residue_config.known_clients.length; ++i) {
    serverInfo.clients.push({
        client_id: residue_config.known_clients[i].client_id,
        loggers: residue_config.known_clients[i].loggers,
    });
}

const activateHook = (hookName, path, config) => {
    const hook = require(path);
    try {
        const hookObj = hook({
            config,
            serverInfo,
        });
        hookObj.hookName = hookName;
        hooks.push(hookObj);
        console.log(`Hooked [${hookName}] from [${path}]`);
    } catch (e) {
        console.error(`Error while loading hook ${hookName}: ${e}`);
        process.exit();
    }
}

config.hooks.forEach((h) => {
    if (!h.enabled) {
        return;
    }
    if (!isEmpty(h.package)) {
        const version = h.version || 'latest';
        console.log(`Downloading ${h.package}@${version}`);
        child_process.execSync(`npm install -g ${h.package}@${version}`,{stdio:[0,1,2]});
        activateHook(h.name, h.package, h.config);
    } else if (!isEmpty(h.path)) {
        activateHook(h.name, h.path, h.config);
    } else {
        console.error(`Invalid hook ${h.name}`)
    }
});

if (isEmpty(hooks)) {
    console.error('No hooks enabled');
    process.exit();
}

const sendToHook = (hook, logger_data, client_data) => {
    if (hook.config.channels.to_logger) {
        if (!includes(hook.config.loggers_ignore_list, logger_data.channel_name)) {
            hook.send(logger_data);
        }
    }
    if (hook.config.channels.to_client) {
        if (!includes(hook.config.clients_ignore_list, client_data.channel_name)) {
            hook.send(client_data);
        }
    }
}

const sendData = (evt, type, line, controller) => {
    if (controller) {
        const logger_data = {
            'event': evt,
            'event_type': type,
            line,
            'channel': 'logger',
            'channel_name': controller.logger_id,
            'client_id': controller.client_id
        };
        const client_data = {
            'event': evt,
            'event_type': type,
            line,
            'channel': 'client',
            'channel_name': controller.client_id,
            'logger_id': controller.logger_id
        };
        if (recent_to_loggers.length > 19) {
            recent_to_loggers.splice(0, recent_to_loggers.length - 19);
        }

        if (recent_to_clients.length > 19) {
            recent_to_clients.splice(0, recent_to_clients.length - 19);
        }

        recent_to_loggers.push(logger_data);
        recent_to_clients.push(client_data);

        hooks.forEach((hook) => {
            if (typeof hook.set_recent === 'function') {
                const recent = {};
                if (hook.config.channels.to_logger) {
                    recent.loggers = recent_to_loggers;
                }
                if (hook.config.channels.to_client) {
                    recent.clients = recent_to_clients;
                }
                hook.set_recent(recent);
            }
            sendToHook(hook, logger_data, client_data);
        });
    }
}

if (isEmpty(residue_config.known_clients)) {
    console.error('ERR: No known clients specified in residue config');
    process.exit();
}

const admin_socket = new net.Socket();
admin_socket.connect(residue_config.admin_port, '127.0.0.1');

const active_processes = [];

const startTail = (clientId) => {
    console.log(`Start client [${clientId}]`);
    const request = {
        _t: parseInt((new Date()).getTime() / 1000, 10),
        type: 5,
        client_id: clientId,
    };

    const encryptedRequest = crypt.encrypt(request);
    admin_socket.write(encryptedRequest, 'utf-8');
}

const processResponse = (response) => {
    if (response.trim().length === 0) {
        return;
    }
    let decrypted = '<failed>';
    try {
        decrypted = crypt.decrypt(response);
        const resp = JSON.parse(decrypted);
        for (let i = 0; i < resp.length; ++i) {
            const list = resp[i].files;

            const controller = {
                logger_id: resp[i].logger_id,
                client_id: resp[i].client_id,
            };

            const files = [];

            for (let j = 0; j < list.length; ++j) {
                if (fs.existsSync(list[j]) && files.indexOf(list[j]) === -1) {
                    files.push(list[j]);
                }
            }

            const tail_process = tail(files, {
                buffer: 0,
            });

            tail_process.on('line', txt => {
                sendData('resitail:line', 'log', txt, controller);
            });

            tail_process.on('info', txt => {
                sendData('resitail:line', 'info', txt, controller);
            });

            tail_process.on('error', error => {
                sendData('resitail:err', 'err', error, controller);
            });

            if (!active_processes[controller.client_id]) {
                active_processes[controller.client_id] = [];
            }

            active_processes[controller.client_id].push(tail_process);
        }
    } catch (err) {
        sendData('resitail:err', 'err', `error occurred, details: ${decrypted}`);
        console.log(err);
    }
}

admin_socket.on('data', (data, cb) => {
    const responses = data.toString().split(packet_delimiter);
    for (let i = 0; i < responses.length; ++i) {
        processResponse(responses[i] + packet_delimiter);
    }
});

// start all the tails
for (let i = 0; i < residue_config.known_clients.length; ++i) {
    startTail(residue_config.known_clients[i].client_id);
}
