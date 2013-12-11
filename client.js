repl = require('repl');
read = require('read');
util = require('util');

var server_prompt = function(data) {
	console.log(data['prompt']);
	read(
	  {},
		function (err, input, isDefault) {
			socket.emit('input', { 'input': '/login ' + input });
		});
};


socket = require('socket.io-client').connect('http://guarded-savannah-9110.herokuapp.com');
socket.on('connect', function(){
  socket.on('output', function(data){
  	console.log(data['output']);
  });

  socket.on('login', server_prompt)

  socket.on('logged_in', function(){
  	repl.start({
			'prompt':'==> ',
			'eval': function(cmd, context, filename, callback){
				socket.emit('input', { input: cmd.substring(1, cmd.length - 2)} );
			},
	  });
  });

  socket.on('disconnect', function(){});

});