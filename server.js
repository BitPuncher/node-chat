var router = require('./router.js'),
    app = require('http').createServer(router),
    io = require('socket.io').listen(app),
    _ = require('underscore')

app.listen(process.env.PORT || 8080);

io.enable('browser client minification');  // send minified client
io.enable('browser client etag');          // apply etag caching logic based on version number
io.enable('browser client gzip');          // gzip the file
io.set('log level', 1);                    // reduce logging

// enable all transports (optional if you want flashsocket support, please note that some hosting
// providers do not allow you to create servers that listen on a port different than 80 or their
// default port)
io.set('transports', [
    'websocket'
  , 'flashsocket'
  , 'htmlfile'
  , 'xhr-polling'
  , 'jsonp-polling'
]);

var publicCommands = {
  '/help': true, 
  '/rooms': true,
  '/join': true,
  '/leave': true,
  '/tell': true,
  '/login': true,
  '/quit': true,
};

var commands = {
  '/join': function(socket, input) {
    if (socket.currentRoom != null) {
      socket.leave(socket.currentRoom);
      socket.broadcast.to(socket.currentRoom).emit('output',
        { output:[socket.username + " has left the channel."]});
    }
    
    socket.join(input);
    socket.currentRoom = input;

    socket.broadcast.to(socket.currentRoom).emit('output', { output:
      [socket.username + " joins the channel."] });

    var allUsers = []
    io.sockets.clients(socket.currentRoom).forEach(function (el) {
      allUsers.push(el.username);
    });

    var outputArr = ["Entering room " + socket.currentRoom];

    allUsers.forEach(function (el) {
      if (el == socket.username) {
        outputArr.push("* " + el + " (** this is you)");
      } else {
        outputArr.push("* " + el);
      }
    });

    outputArr.push("end of list.");

    socket.emit('output', { 'output':outputArr });
  },

  '/leave': function(socket) {
    if (socket.currentRoom != "lobby") {
      this['/join'](socket, 'lobby');
    } else {
      socket.emit('output', { output: ["You are in the lobby."]})
    }
  },

  '/send': function(socket, input) {
    io.sockets.in(socket.currentRoom).emit('output', { 
          'output':[socket.username + ": " + input] });
  },

  '/rooms': function(socket) {
    outputArr = ["List of channels. /join to create."];
    Object.keys(io.sockets.manager.rooms).forEach(function(room) {
      outputArr.push ("* " + room);
    })
    outputArr.push("end of list.");

    socket.emit('output', { output: outputArr });
  },

  '/help': function(socket) {
    outputArr = ["List of commands."];
    Object.keys(publicCommands).forEach(function(room) {
      outputArr.push("* " + room);
    })
    outputArr.push("end of list.");

    socket.emit('output', { output: outputArr });
  },

  '/login': function(socket, input) {
    input = input.replace(/\s/g, "_");

    if (used_names[input] == true){
      socket.emit('login', { output:["Name taken.", "Login Name?"] });
    }
    else {
      used_names[input] = true;
      socket.username = input;
      socket.emit('logged_in');
      var outputArr = ["Welcome, " + socket.username];
      socket.emit('output', { output: outputArr })
      socket.currentRoom = null;
      this['/join'](socket, 'lobby');
    }
  },

  '/quit': function (socket, input) {
    socket.broadcast.to(socket.currentRoom).emit('output',
      { output:[socket.username + " has left the channel."]});
  },

  '/tell': function(socket, input) {
    var targetUser = input.match(/^\S+/)[0];
    input = input.substring(targetUser.length + 1, input.length);
    var targetSocket = null;
    io.sockets.clients().forEach(function(el) {
      if (el.username == targetUser) {
        targetSocket = el;
      }
    });

    if (targetSocket == null) {
      socket.emit('output', { output:["Specified user " + targetUser + 
        " does not exist."] });
    } else {
      socket.emit('output', { output:["to " + targetUser + ": " + input] });
      targetSocket.emit('output', { output:["from " + socket.username + 
        ": " + input] });
    }
  },

  '/error': function(socket, input) {
    var outputArr = ['ERROR: ' + input + ' is not a valid command.'];
    socket.emit('output', { output: outputArr });
  },
};

var used_names = {};

var event_router = function (input) {
  if (input['input'][0] == '/') {
    var command = input['input'].match(/^\S+/)[0];
    input = input['input'].substring(command.length + 1, input.length);

    if (publicCommands[command] != null) {
      commands[command](this, input);
    } else {
      commands['/error'](this, command);
    }
  } else {
    commands['/send'](this, input['input']);
  }
}

io.sockets.on('connection', function (socket) {
  socket.emit('login', { output:["Welcome to XYZ chat server.", "Login Name?"]});
  socket.on('input', event_router);
  socket.on('disconnect', function() {
    socket.broadcast.to(socket.currentRoom).emit('output',
        { output:[socket.username + " has left the channel."]});
    delete used_names[socket.username];
  })
});