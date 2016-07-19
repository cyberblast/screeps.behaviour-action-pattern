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
        //MODULES.creep.setup.healer,
        MODULES.creep.setup.claimer].forEach(function(set) {
            if( !spawn.busy && set.isValidSetup(spawn) ){
                var params =  set.buildParams(spawn);
                var newName = spawn.createCreep(params.parts, params.id, params);
                if( params.id == newName ){
                    spawn.busy = true;
                    if(!spawn.room.population[params.setup]){
                        spawn.room.population[params.setup] = {
                            weight: params.cost, 
                            count : 1
                        };
                    }
                    else {
                        spawn.room.population[params.setup].count++;
                        spawn.room.population[params.setup].weight += params.cost;
                    }
                    if(!Game.population[params.setup]){
                        Game.population[params.setup] = {
                            weight: params.cost, 
                            count : 1
                        };
                    }
                    else {
                        Game.population[params.setup].count++;
                        Game.population[params.setup].weight += params.cost;
                    }
                }
                console.log(params.id == newName || ERROR_CODE(newName) == undefined ? 
                    spawn.name + ' > Good morning ' + newName + '!': 
                    spawn.name + ' > Offspring failed: ' + ERROR_CODE(newName));
            }
        });
    }
};

module.exports = mod;