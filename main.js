var room = require('room');
var creep = require('creep');
var spawn = require('creep');

module.exports.loop = function () {
    room.loop();
    creep.loop();
    spawn.loop();
};