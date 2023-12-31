'use strict';

var os = require('os');
var nodeStatic = require('node-static');
var http = require('http');
var socketIO = require('socket.io');

var fileServer = new(nodeStatic.Server)();
// For deploy in heroku getting the port from environment variable PORT is needed in other platforms is used 8080
var server_port = process.env.PORT || '8080'; 
var app = http.createServer(function(req, res) {
  fileServer.serve(req, res);
}).listen(server_port);
console.log('Running in http://localhost:' + server_port + '/index.html');
console.log('VideoCall in in http://localhost:' + server_port + '/home.html');

var io = socketIO(app);
io.on('connection', function(socket) {

  // convenience function to log server messages on the client
  function log() {
    var array = ['Message from server:'];
    array.push.apply(array, arguments);
    socket.emit('log', array);
  }

  socket.on('message', function(message) {
    log('Client said: ', message);
    // for a real app, would be room-only (not broadcast)
    socket.broadcast.emit('message', message);
  });

  socket.on('create or join', function(room) {
    console.log('Received request to create or join room ' + room);
    log('Received request to create or join room ' + room);

    var clientsInRoom = io.sockets.adapter.rooms.get(room);
    var numClients = clientsInRoom ? clientsInRoom.size : 0;

    log('Room ' + room + ' now has ' + numClients + ' client(s)');
    if (numClients === 0) {
      socket.join(room);
      console.log(io.sockets.adapter.rooms.get(room));
      log('Client ID ' + socket.id + ' created room ' + room);
      socket.emit('created', room, socket.id);

    } else if (numClients === 1) {
      log('Client ID ' + socket.id + ' joined room ' + room);
      io.sockets.in(room).emit('join', room);
      socket.join(room);
      console.log(io.sockets.adapter.rooms.get(room));
      socket.emit('joined', room, socket.id);
      socket.to(room).emit('ready', room, socket.id);
    } else { // max two clients
      socket.emit('full', room);
    }
  });
});