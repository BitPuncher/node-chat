var fs = require('fs');

module.exports = function (req, res) {
	if (req.url == "/") {
		serveFile('./index.html', res);
	} else {
		serveFile(req.url, res);
	}
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

		var fileType = url.match(/\.\w+$/)[0];

		if (fileType == ".js") {
			res.writeHead(200, {'content-type': 'text/javascript' });
		} else if (fileType == ".css") {
			res.writeHead(200, {'content-type': 'text/css' });
		} else {
			res.writeHead(200, {'content-type': 'text/html' });
		}

		res.end(data);
	});
};
