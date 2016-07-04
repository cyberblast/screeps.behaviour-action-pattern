var room = require('room');
var creeps = require('creep');

var mod = {
    run: function(resetMemory){
        for(var iRoom in Game.rooms){
            room.init(Game.rooms[iRoom], resetMemory);   
        }
        creeps.initCreeps(resetMemory);
        for(var iSpawn in Game.spawns){
            creeps.breed(Game.spawns[iSpawn]);
        }
    }
};

module.exports = mod;