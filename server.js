'use strict'

const express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

var users = [];
var connections = [];
var messages = [];

server.listen(process.env.PORT || 3000);
console.log('Server running...');

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.sockets.on('connection', (socket)=>{
  connections.push(socket);
  console.log("Connected %s sockets connected", connections.length);

  //Disconnect
  socket.on('disconnect', (data)=>{
    //Deletes the disconnected user from the users array
    users.splice(users.indexOf(socket.username), 1);
    updateUsernames();
    connections.splice(connections.indexOf(socket), 1);
    console.log('Disconnected %s sockets connected', connections.length);
  });

  //Send Message
  socket.on('send message', (data)=>{
    //console.log(data);
    io.sockets.emit('new message', {msg: data, user: socket.username});
    messages.push({msg: data, user: socket.username});
  });

  //New User
  socket.on('new user', (data, callback) => {
    callback(true);
    socket.username = data;
    //console.log(data);
    users.push(socket.username);
    reloadMessages();
    updateUsernames();
  });

  //Update all the users each connection
  function updateUsernames(){
    io.sockets.emit('get users', users);
  }

  function reloadMessages(){
    io.sockets.emit('get messages', messages);
    //socket.broadcast.emit('get messages', messages);
  }

});