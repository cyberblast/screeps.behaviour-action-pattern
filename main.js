var rooms = require('room');
var creeps = require('creep');
var spawns = require('spawn');
var towers = require('tower');
var strategy = require('strategy.growth');

module.exports.loop = function () {
    rooms.loop();
    creeps.loop(strategy);
    spawns.loop(strategy);
    towers.loop();
};