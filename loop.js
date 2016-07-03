var room = require('room');
var creeps = require('creep');

var mod = {
    run: function(){
        for(var iRoom in Game.rooms){
            room.init(Game.rooms[iRoom]);   
        }
        creeps.reset();
        creeps.initCreeps();
        for(var iSpawn in Game.spawns){
            creeps.breed(Game.spawns[iSpawn]);
        }
    }
};

module.exports = mod;