var fs = require('fs');

module.exports = function (req, res) {
		serveFile('./index.html', res);
}

var serveFile = function (url, res) {
	if 	(url[0] != ".") {
		url = '.' + url;
	}
	fs.readFile(url, {'encoding': 'utf8'}, function (err, data) {
		if (err) {
			res.writeHead(404);
			res.end();
		}

		res.writeHead(200, {'Content-Type': 'text/html'});
		res.end(data);
	});
};
