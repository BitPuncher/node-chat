var logged_in = false;

var output = function (data) {
	data['output'].forEach(function (str) {
		var output = $("<div class='chat-message'></div>")
		data['output'].forEach(function (line) {
			output.append(line);
		});

		$('#chatbox').append(output);
	});
}

socket = require('socket.io-client').connect('http://localhost:8080');
socket.on('connect', function(){
  socket.on('output', output);

  socket.on('login', output);

  socket.on('logged_in', function(){
  	logged_in = true;
  });
});

$('.chat-form').on('submit', function (event) {
	event.preventDefault();
	debugger
	if (!logged_in) {
		socket.emit('input', { 'input': '/login ' + input });
	} else {
		socket.emit('input', {})
	}
});