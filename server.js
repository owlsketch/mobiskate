var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http); //require socket, mount onto server
var mongoose = require('mongoose');
var Game = require('./models/Game');
var shortid = require('shortid');
var secrets = require('./secrets');

mongoose.connect(secrets.mongoConnection);
mongoose.connection.on('error', function () {
	console.log("MongoDB Error!!!");
	process.exit(1);
});

app.use(express.static('static')); //for loading static files

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

			//insert to db
			var game = new Game({
				socketID: socket.id,
				code: returnCode.code,
				available: true
			});

			game.save(function(err) {
				if(err) {
					return next(err);
				}
			});
			
		}
		/*if not desktop, do nothing */
	});

	//need to listen for when mobile side sends in the correct code
	socket.on('confirm', function(info) {
		//only controllers can send the code
		if(info.source === "mobile") {
			//need to see if the given code is code for one of our open sockets
			Game.findOne({code: info.code, available: true}, function(err, gameObj) {
				if(err) {
					return next(err);
				}
				if(!gameObj) {
					//need to inform the user!
					socket.emit("wrongCode");
				}
				else {
					//if found, update info
					gameObj.available = false;
					gameObj.save(function(err) {
						if(err) {
							return next(err);
						}
					});

					//now give socketID to mobile so it has permission to communicate with directly
					var socketID = gameObj.socketID;
					socket.emit("rightCode", {socket: socketID}); 
				}
			});


		}
	});


	//only when we have gotten the right code will we be able to
	//access this and send the info to our desktop
	socket.on('accelInfo', function(info) {
		var ran = Math.random();
		socket.broadcast.to(info.socket).emit('accelMessage', {message: ran});
	});

	socket.on('disconnect', function() {
		console.log('a user disconnected');		
		});
});

http.listen(3000, function(){
	console.log('listening on *:3000');
});
