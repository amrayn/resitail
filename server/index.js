const app = require('express')();
const http = require('http');
const server = http.Server(app);
const io = require('socket.io')(server);
const fs = require('fs');
const net = require('net');
const tail = require('./tail');
const residue_crypt = require('./residue_crypt');
const proc = require('./option_parser');

proc.parse(process.argv);
if (proc.config === false) {
  console.error('No config file provided. resitail --config <residue_config> --port <port>');
  process.exit();
}

const residue_config = JSON.parse(fs.readFileSync(proc.config));
const crypt = residue_crypt(residue_config);

app.get('*', function(req, res, next) {
  if (req.originalUrl.indexOf('/?') === -1) {
    res.sendFile(__dirname + '/web/' + req.originalUrl);
  } else {
    return next();
  }
});

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/web/index.html');
});

io.on('connection', function(socket) {
  const tails = {};
  const residue_connection = new net.Socket();
  residue_connection.on('data', function(data, cb) {
      let decrypted = '<failed>';
      try {
        decrypted = crypt.decrypt(data.toString());
        const resp = JSON.parse(decrypted);
        for (var i = 0; i < resp.length; ++i) {
          const list = resp[i].files;

          const finalList = [];

          for (var j = 0; j < list.length; ++j) {
            if (fs.existsSync(list[j])) {
              finalList.push(list[j]);
            }
          }

          const tailProcess = tail(finalList, {
            buffer: 10,
          });

          tailProcess.on('line', function(data) {
              socket.emit('resitail:line', {
                type: 'log',
                data: data,
              });
          });

          tailProcess.on('info', function(data) {
            socket.emit('resitail:line', {
              type: 'info',
              data: data,
            });
          });

          tailProcess.on('error', function(error) {
            socket.emit('resitail:err', {
              type: 'err',
              data: data,
            });
          });

          if (typeof tails[socket.id] === 'undefined') {
            tails[socket.id] = [];
          }

          tails[socket.id].push(tailProcess);
          console.log(finalList);
        }
      } catch (err) {
        socket.emit('resitail:err', {
          type: 'err',
          data: `error occurred, details: ${decrypted}`,
        });
        console.log(err);
      }
  });

  residue_connection.on('close', function() {
      console.log('Remote connection closed!');
  });

  residue_connection.on('error', function(error) {
      console.log('Error occurred while connecting to residue server');
      console.log(error);
  });

  socket.on('resitail:connect', function(parameters) {
    var params = {};
    var query = parameters.substr(1).split('&');
    for (var i = 0; i < query.length; ++i) {
        params[query[i].split('=')[0]] = query[i].split('=')[1];
    }

    var request = {
      _t: parseInt((new Date()).getTime() / 1000, 10),
      type: 5,
    };

    if (params.clientId) {
      request.client_id = params.clientId;
    }
    if (params.loggerId) {
      request.logger_id = params.loggerId;
    }
    if (params.levels) {
      request.logging_levels = params.levels.split(',');
    }

    residue_connection.connect(residue_config.admin_port, 'localhost', function() {
      const encryptedRequest = crypt.encrypt(request);
      console.log('Request: ');
      console.log(encryptedRequest);
      residue_connection.write(encryptedRequest, 'utf-8');
    });

  });

  socket.on('disconnect', function() {
    if (typeof tails[socket.id] === 'undefined') {
      return;
    }
    console.log(socket.id);
    for (var i = 0; i < tails[socket.id].length; ++i) {
      tails[socket.id][i].kill();
    }
    tails[socket.id] = null;
  });
});

server.listen(proc.port, function() {
  console.log('Started server on *:' + proc.port);
});
