
var mod = {
    self: this,
    loop: function(strategy){
        for(var iSpawn in Game.spawns){
            this.createCreep(Game.spawns[iSpawn], strategy);
        }
    },
    createCreep: function(spawn, strategy){
        if (spawn.room.energyAvailable > strategy.minBuildEnergy && 
            spawn.room.find(FIND_CREEPS).length < strategy.maxSpawnCount) {

            var build = strategy.creepSetup(spawn);
            if (build && build.parts.length > 0) {
                var name = null;
                for( var son = 1; name == null || Game.creeps[name]; son++ ) {
                    name = build.setup + '.' + build.cost + '.' + son;
                }
                var newName = spawn.createCreep(build.parts, name, build);
                //spawn.room.memory.creeps[role] += build.cost;
                console.log('Spawning ' + newName);
            }
        }
    }
};

module.exports = mod;