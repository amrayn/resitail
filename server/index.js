const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const fs = require('fs');
const net = require('net');
const tail = require('./tail');
const residue_crypt = require('./residue_crypt');

const port = process.env.PORT || 3000;
const residue_config = JSON.parse(fs.readFileSync(process.argv[2]));
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
      try {
        let resp = JSON.parse(crypt.decrypt(data.toString()));
        for (var i = 0; i < resp.length; ++i) {
          let list = resp[i].list;
          for (var j = 0; j < list.length; ++j) {
            const logFile = list[j];
            console.log('checking ' + logFile);
            if (fs.existsSync(logFile)) {

              const tailProcess = tail(logFile, {
                buffer: 10,
              });

              tailProcess.on('line', function(data) {
                socket.emit('resitail:line', data);
              });

              tailProcess.on('info', function(data) {
                socket.emit('resitail:line', `<span class='line-info'>${data}</span>`);
              });

              tailProcess.on('error', function(error) {
                socket.emit('resitail:line', `<span class='line-err'>${data}</span>`);
              });

              if (typeof tails[socket.id] === 'undefined') {
                tails[socket.id] = [];
              }

              tails[socket.id].push(tailProcess);
              console.log('tailing ' + logFile);
            }
          }
        }
      } catch (err) {
        socket.emit('resitail:err', 'error occurred');
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

http.listen(port, function() {
  console.log('Started server on *:' + port);
});
