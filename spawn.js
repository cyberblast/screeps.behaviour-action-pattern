var mod = {
    extend: function(){
        Spawn.prototype.loop = function(){
            if( this.spawning ) return;
            var self = this;
            [Creep.setup.worker, 
                Creep.setup.melee,
                Creep.setup.ranger,
                Creep.setup.healer,
                Creep.setup.claimer, 
                Creep.setup.pioneer, 
                Creep.setup.privateer
            ].forEach(function(set) {
                if( set.isValidSetup(self) ){
                    var params =  set.buildParams(self);
                    var newName = self.createCreep(params.parts, params.id, params);
                    if( params.id == newName || ERROR_CODE(newName) === undefined ){ // other name assigned?
                        Population.registerCreepSetup(self.room, params.setup, params.cost);
                        if(DEBUG) console.log( DYE(CRAYON.system, self.name + ' &gt; ') + DYE(CRAYON.birth, 'Good morning ' + newName + '!') );
                        return;
                    } 
                    
                    console.log( DYE(CRAYON.system, self.name + ' &gt; ') + DYE(CRAYON.error, 'Offspring failed: ' + ERROR_CODE(newName)) );
                }
            });
        };
        Spawn.loop = function(){
            if( Game.time % SPAWN_INTERVAL == 0 ) {        
                var loop = spawn => { 
                    if( !spawn.spawning ) 
                    spawn.loop(); 
                };
                _.forEach(Game.spawns, loop);
            }
        }
    }
};

module.exports = mod;
