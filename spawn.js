var mod = {
    self: this,
    loop: function(){
        for(var iSpawn in Game.spawns){
            var spawn = Game.spawns[iSpawn];
            if( !spawn.spawning )
                this.createCreep(spawn);
        }
    },
    createCreep: function(spawn){
        [MODULES.creep.setup.worker, 
        MODULES.creep.setup.melee,
        MODULES.creep.setup.ranger,
        MODULES.creep.setup.claimer].forEach(function(set) {
            if( !spawn.busy && set.isValidSetup(spawn) ){
                var params =  set.buildParams(spawn);
                var newName = spawn.createCreep(params.parts, params.id, params);
                if( set.id == newName ){
                    spawn.busy = true;
                    if(!spawn.room.population[set.setup]){
                        spawn.room.population[set.setup] = {
                            weight: set.cost, 
                            count : 1
                        };
                    }
                    else {
                        spawn.room.population[set.setup].count++;
                        spawn.room.population[set.setup].weight += set.cost;
                    }
                    if(!Game.population[set.setup]){
                        Game.population[set.setup] = {
                            weight: set.cost, 
                            count : 1
                        };
                    }
                    else {
                        Game.population[set.setup].count++;
                        Game.population[set.setup].weight += set.cost;
                    }
                }
                console.log(set.id == newName || ERROR_CODE(newName) == undefined ? 
                    spawn.name + ' > Good morning ' + newName + '!': 
                    spawn.name + ' > Offspring failed. They call it "' + ERROR_CODE(newName) + '".');
            }
        });
    }
};

module.exports = mod;