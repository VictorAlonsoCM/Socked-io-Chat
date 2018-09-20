'use strict'

const express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
//Sessions
var session = require("express-session")({
  secret: "my-secret",
  resave: true,
  saveUninitialized: true
});
var sharedsession = require("express-socket.io-session");
app.use(session);
// Use shared session middleware for socket.io
// setting autoSave:true
io.use(sharedsession(session, {
  autoSave:true
})); 

var users = {};
var connections = [];
var messages = [];

server.listen(process.env.PORT || 3000);
console.log('Server running...');

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.sockets.on('connection', (socket)=>{
  connections.push(socket);
  console.log('Login: ', socket.handshake.session.userdata);
  console.log("Connected %s sockets connected", connections.length);
  console.log(socket.id);
  //Sessions


  socket.on("login", function(userdata) {
    socket.handshake.session.userdata = userdata;
    socket.handshake.session.save();
    console.log('Login: ', userdata);
    app.set('username', userdata);
  });
  socket.on("logout", function(userdata) {
      if (socket.handshake.session.userdata) {
          delete socket.handshake.session.userdata;
          socket.handshake.session.save();
      }
  });

  //Disconnect
  socket.on('disconnect', (data)=>{
    //Deletes the disconnected user from the users array
    delete users[socket.username];
    //users.splice(users.indexOf(socket.username), 1);
    updateUsernames();
    connections.splice(connections.indexOf(socket), 1);
    console.log('Disconnected %s sockets connected', connections.length);
  });

  //Send Message
  socket.on('send message', (data)=>{
    var msg = data.trim();
    if(msg.substr(0, 3) === '/w '){
      console.log("Whisper");
      users[socket.username].emit('private', {msg: 'hello welcome', user: 'Admin'});
      console.log(users[socket.username]);
    }
    //console.log(data);
    io.sockets.emit('new message', {msg: data, user: socket.username});
    messages.push({msg: data, user: socket.username});
  });

  //New User
  socket.on('new user', (data, callback) => {
    callback(true);
    socket.username = data;
    //console.log(data);
    users[socket.username] = socket;
    //users.push(socket.username);
    reloadMessages();
    updateUsernames();
  });

  //Update all the users each connection
  function updateUsernames(){
    io.sockets.emit('get users', Object.keys(users));
  }

  function reloadMessages(){
    io.sockets.emit('get messages', messages);
    //socket.broadcast.emit('get messages', messages);
  }

});