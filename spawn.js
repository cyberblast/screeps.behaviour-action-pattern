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
        MODULES.creep.setup.defender].forEach(function(set) {
            if( !spawn.busy && set.isValidSetup(spawn) ){
                var params =  set.buildParams(spawn);
                var newName = spawn.createCreep(params.parts, params.id, params);
                console.log(set.id == newName || ERROR_CODE(newName) == undefined ? 
                    spawn.name + ' > Good morning ' + newName + '!': 
                    spawn.name + ' > Offspring failed. They call it "' + ERROR_CODE(newName) + '".');
                spawn.busy = true;
            }
        });
    }
};

module.exports = mod;