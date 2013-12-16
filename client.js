repl = require('repl');
read = require('read');
util = require('util');

var server_prompt = function (data) {
	output(data);
	read(
	  {},
		function (err, input, isDefault) {
			socket.emit('input', { 'input': '/login ' + input });
		});
};

var output = function (data) {
	data['output'].forEach(function (str) {
  		console.log("<== " + str);
  	});
}


socket = require('socket.io-client').connect('http://guarded-savannah-9110.herokuapp.com');
socket.on('connect', function(){
  socket.on('output', output);

  socket.on('login', server_prompt);

  socket.on('logged_in', function(){
  	repl.start({
			'prompt':'==> ',
			'eval': function(cmd, context, filename, callback){
				socket.emit('input', { input: cmd.substring(1, cmd.length - 2)} );

				if (cmd === "(/quit\n)") {
					console.log("Goodbye!");
					process.kill();
				}
			},
	  });
  });
});