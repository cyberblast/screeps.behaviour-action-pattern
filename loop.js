var rooms = require('room');
var creeps = require('creep');

var mod = {
    run: function(){
        rooms.init();
        creeps.inventory();
        creeps.init();
        for(var iSpawn in Game.spawns){
            creeps.breed(Game.spawns[iSpawn]);
        }
    }
};

module.exports = mod;