const fs = require('fs');
const net = require('net');
const slackbot = require('slack-node');
const isEmpty = require('lodash.isempty');
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
if (!config.channels) {
    console.error('Invalid configuration. Missing: channels');
    process.exit();
}
const residue_config = JSON.parse(fs.readFileSync(config.residue_config));
const crypt = residue_crypt(residue_config);
const packet_delimiter = '\r\n\r\n';

const slack = new slackbot();

slack.setWebhook(config.webhook_url);

slackSend = (data, channel) => {
    slack.webhook({
        channel: channel,
        username: config.username || 'resitail',
        text: config.template.replace('%line', data)
    }, (err, response) => {
        if (err || response.status === 'fail') {
            console.log(response.response + ' - channel: ' + channel);
        }
    });
}

sendData = (evt, type, data, controller) => {
    if (controller) {
        if (config.channels.to_logger) {
            slackSend(data, controller.logger_id);
        }
        if (config.channels.to_client) {
            slackSend(data, controller.client_id);
        }
    }
}

if (isEmpty(residue_config.known_clients)) {
    console.error('ERR: No known clients specified in residue config');
    process.exit();
}

const admin_socket = new net.Socket();
admin_socket.connect(residue_config.admin_port, '127.0.0.1');

const active_processes = [];

startTail = (clientId) => {
    const request = {
        _t: parseInt((new Date()).getTime() / 1000, 10),
        type: 5,
        client_id: clientId,
    };

    const encryptedRequest = crypt.encrypt(request);
    admin_socket.write(encryptedRequest, 'utf-8');
}

processResponse = (response) => {
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
                if (fs.existsSync(list[j])) {
                    files.push(list[j]);
                }
            }

            const tail_process = tail(files, {
                buffer: 0,
            });

            tail_process.on('line', data => {
                sendData('resitail:line', 'log', data, controller);
            });

            tail_process.on('info', data => {
                sendData('resitail:line', 'info', data, controller);
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
