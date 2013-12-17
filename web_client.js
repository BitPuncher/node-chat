var logged_in = false;

var output = function (data) {
	data['output'].forEach(function (str) {
		var output = $("<div class='chat-message'></div>")
		
		output.text(str);

		$('#chatbox').append(output);
	});
	$('#chatbox').scrollTop($('#chatbox')[0].scrollHeight);
}

socket = io.connect('http://guarded-savannah-9110/herokuapp.com');
socket.on('connect', function(){
  socket.on('output', output);

  socket.on('login', output);

  socket.on('logged_in', function(){
  	logged_in = true;
  });
});