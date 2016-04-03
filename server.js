var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http); //require socket, mount onto server
var shortid = require('shortid');
// root site
app.get('/', function(req,res) {
	res.sendFile(__dirname + '/index.html');
});

//game is hosted here
app.get('/desktop', function(req,res) {
	res.sendFile(__dirname + '/desktop.html');
});

//controller page
app.get('/mobile', function(req,res) {
	res.sendFile(__dirname + '/mobile.html');
});

io.on('connection', function(socket) { //a socket is a single connection

	//need to determine if connection is from a desktop or mobile pc
	socket.on('identify', function(id) {
		//if desktop, need to create a code for it, and send it to user
		//we send to user so they can read the code, and send through controller
		//this creates socket connection
		if(id.source === "desktop") {
			var returnCode = {code: shortid.generate()};
			socket.emit("uniqueCode", returnCode);

			//also need to apply this code to this socket
		}
		/*if not desktop, do nothing */
	});

	//need to listen for when mobile side sends in the correct code
	socket.on('confirm', function(info) {
		//only controllers can send the code
		if(info.source === "mobile") {
			//need to see if the given code is code for one of our open sockets
			//if yes, create lobby for desktop socket and mobile socket only, begin communication
			console.log(info.code);			
			//else, print, wrong code
		}
	});

	socket.on('disconnect', function() {
		console.log('a user disconnected');		
		});
});

http.listen(3000, function(){
	console.log('listening on *:3000');
});
