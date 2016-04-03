var mongoose = require('mongoose');

var gameSchema = new mongoose.Schema({
	socketID: String,
	code: String,
	available: Boolean
});

var Game = mongoose.model('Game', gameSchema);

module.exports = Game;
