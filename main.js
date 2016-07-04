var rooms = require('room');
var creeps = require('creep');
var spawns = require('spawn');

module.exports.loop = function () {
    rooms.loop();
    creeps.loop();
    spawns.loop();
};