var creeps = require('creep');

var mod = {
    run: function(){
        creeps.reset();
        creeps.initCreeps();
        for(var iSpawn in Game.spawns){
            creeps.breed(Game.spawns[iSpawn]);
        }
    }
};

module.exports = mod;