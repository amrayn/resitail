const app = require('express')();
const http = require('http');
const server = http.Server(app);
const io = require('socket.io')(server);
const fs = require('fs');
const net = require('net');
const slackbot = require('slack-node');
const find = require('lodash.find');
const isEmpty = require('lodash.isempty');
const tail = require('./tail');
const residue_crypt = require('./residue_crypt');
const proc = require('./option_parser');

proc.parse(process.argv);
if (proc.residue_config === false || proc.slack_config === false) {
  console.error('ERR: No config file provided\nUsage: resitail --residue_config <residue_config> --slack_config <slack_config> [--port <port>]\n');
  process.exit();
}

const slack_config = proc.slack_config ? JSON.parse(fs.readFileSync(proc.slack_config)) : null;
const residue_config = JSON.parse(fs.readFileSync(proc.residue_config));
const crypt = residue_crypt(residue_config);
const slack = new slackbot();

slack.setWebhook(slack_config.webhook_url);

slackSend = function(data, channel) {
  slack.webhook({
    channel: channel,
    username: 'resitail',
    text: `\`${data}\``
  }, function(err, response) {
    if (err || response.status === 'fail') {
      console.log(response.response);
    }
  });
}

sendData = function(evt, type, data, controller) {
    if (controller) {
		if (slack_config.to_logger) {
	        slackSend(data, controller.logger_id);
	    }
	    if (slack_config.to_client) {
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

/**
 * Sends request to admin request handler to retrieve all the loggers for client
 */
function startTail(clientId) {
    var request = {
      _t: parseInt((new Date()).getTime() / 1000, 10),
      type: 5,
	  client_id: clientId,
    };

    const encryptedRequest = crypt.encrypt(request);
    admin_socket.write(encryptedRequest, 'utf-8');
}

processResponse = function(response) {
    let decrypted = '<failed>';
    try {
      decrypted = crypt.decrypt(response);
      const resp = JSON.parse(decrypted);
      for (var i = 0; i < resp.length; ++i) {
        const list = resp[i].files;
	  
        const controller = {
          logger_id: resp[i].logger_id,
  		client_id: 'muflihun00102030',
        };

        const files = [];

        for (var j = 0; j < list.length; ++j) {
          if (fs.existsSync(list[j])) {
            files.push(list[j]);
          }
        }

        const tail_process = tail(files, {
          buffer: 10,
        });

        tail_process.on('line', function(data) {
            sendData('resitail:line', 'log', data, controller);
        });

        tail_process.on('info', function(data) {
            sendData('resitail:line', 'info', data, controller);
        });

        tail_process.on('error', function(error) {
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

admin_socket.on('data', function(data, cb) {
  let resp = data.toString().split("\r\n\r\n");
  
  for (var i = 0; i < resp.length; ++i) {
	  processResponse(resp[i] + "\r\n\r\n");
  }
});

// start all the tails
for (let i = 0; i < residue_config.known_clients.length; ++i) {
	startTail(residue_config.known_clients[i].client_id);
}

server.listen(proc.port, function() {
  console.log('Started server on *:' + proc.port);
});
