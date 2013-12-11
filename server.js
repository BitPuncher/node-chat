var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs'), _ = require('underscore')

app.listen(80);

var commands = {
  '/join': function(socket, input) {
    socket.leave(socket.currentRoom);
    socket.broadcast.to(socket.currentRoom).emit('output',
      { output:"<== " + socket.username + " has left the channel."});

    socket.join(input);
    socket.currentRoom = input;

    socket.broadcast.to(socket.currentRoom).emit('output', { output:"<== " + 
      socket.username + " joins the channel.\n" });

    var allUsers = []
    io.sockets.clients(socket.currentRoom).forEach(function (el) {
      allUsers.push(el.username);
    });

    var outputString = "<== entering room " + socket.currentRoom + ".\n"

    allUsers.forEach(function (el) {
      if (el == socket.username) {
        outputString += "<== * " + el + " (** this is you)\n"
      } else {
        outputString += "<== * " + el + "\n";
      }
    });

    outputString += "<== end of list.\n";

    socket.emit('output', { 'output':outputString });
  },

  '/leave': function(socket) {
    if (socket.currentRoom != "lobby") {
      this['/join'](socket, 'lobby');
    } else {
      socket.emit('output', { output: "<== You are in the lobby.\n"})
    }
  },

  '/send': function(socket, input) {
    io.sockets.in(socket.currentRoom).emit('output', { 
          'output':"<== " + socket.username + ": " + input });
  },

  '/rooms': function(socket) {
    outputString = "<== List of channels. /join to create.\n";
    Object.keys(io.sockets.manager.rooms).forEach(function(room) {
      outputString += "<== * " + room + "\n";
    })
    outputString += "<== end of list.";

    socket.emit('output', { output: outputString });
  },

  '/help': function(socket) {
    outputString = "<== List of commands.\n";
    Object.keys(this).forEach(function(room) {
      outputString += "<== * " + room + "\n";
    })
    outputString += "<== end of list.";

    socket.emit('output', { output: outputString });
  },

  '/login': function(socket, input) {
    if (_.include(used_names, input)){
      socket.emit('login', {prompt:"<== Name taken.\n<== Login Name?"})
    }
    else {
      used_names.push(input);
      socket.username = input;
      socket.emit('logged_in');
      var outputString = "<== Welcome, " + socket.username + ".\n";
      socket.emit('output', { output: outputString })
      this['/join'](socket, 'lobby');
    }
  }
};

var rooms = {
  lobby:0,
};

var users = {

};

var used_names = [];



function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

var event_router = function (input) {
  if (input['input'][0] == '/') {
    var command = input['input'].match(/^\S+/)[0];
    input = input['input'].substring(command.length + 1, input.length);

    commands[command](this, input);
  } else {
    commands['/send'](this, input['input']);
  }
}

io.sockets.on('connection', function (socket) {
  socket.emit('login', { prompt:"<== Welcome to XYZ chat server.\n" + 
    "<== Login Name?" });
  socket.on('input', event_router);
});