var rooms = require('room');
var creeps = require('creep');
var spawns = require('spawn');
var strategy = require('strategy.growth');

module.exports.loop = function () {
    rooms.loop();
    creeps.loop(strategy);
    spawns.loop(strategy);
};