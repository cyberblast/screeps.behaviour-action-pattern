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
        MODULES.creep.setup.claimer, 
        MODULES.creep.setup.melee,
        MODULES.creep.setup.ranger
        //MODULES.creep.setup.healer
        ].forEach(function(set) {
            if( !spawn.busy && set.isValidSetup(spawn) ){
                var params =  set.buildParams(spawn);
                if( DEBUG ) console.log(spawn.name + ' > Spawning new ' + params.setup + ' @ ' + (Game.population[params.setup] ? Game.population[params.setup].count : 0) + ' total already existing');
                var newName = spawn.createCreep(params.parts, params.id, params);
                if( params.id == newName ){
                    spawn.busy = true;
                    MODULES.population.registerCreepSetup(spawn.room, params.setup, params.cost);
                }
                
                console.log(params.id == newName || ERROR_CODE(newName) === undefined ? 
                    spawn.name + ' > Good morning ' + newName + '!': 
                    spawn.name + ' > Offspring failed: ' + ERROR_CODE(newName));
                if( DEBUG ) console.log(spawn.name + ' > New total population of ' + params.setup + ': ' + (Game.population[params.setup] ? Game.population[params.setup].count : 0) + '<br/> ');
            }
        });
    }
};

module.exports = mod;