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
        [Creep.setup.worker, 
            Creep.setup.melee,
            Creep.setup.ranger,
            Creep.setup.healer,
            Creep.setup.claimer, 
            Creep.setup.pioneer, 
            Creep.setup.privateer
        ].forEach(function(set) {
            if( !spawn.busy && set.isValidSetup(spawn) ){
                var params =  set.buildParams(spawn);
                
                var newName = spawn.createCreep(params.parts, params.id, params);
                if( params.id == newName ){
                    spawn.busy = true;
                    MODULES.population.registerCreepSetup(spawn.room, params.setup, params.cost);
                }
                
                console.log(params.id == newName || ERROR_CODE(newName) === undefined ? 
                    DYE(CRAYON.system, spawn.name + ' &gt; ') + DYE(CRAYON.birth, 'Good morning ' + newName + '!'): 
                    DYE(CRAYON.system, spawn.name + ' &gt; ') + DYE(CRAYON.error, 'Offspring failed: ' + ERROR_CODE(newName)));
            }
        });
    }
};

module.exports = mod;