var mod = {
    extend: function(){
        Spawn.prototype.priority = [
            Creep.setup.worker, 
            Creep.setup.melee,
            Creep.setup.ranger,
            Creep.setup.healer,
            Creep.setup.claimer, 
            Creep.setup.pioneer, 
            Creep.setup.privateer];
        Spawn.prototype.loop = function(){
            if( this.spawning ) return;
            var self = this;
            var probe = setup => {
                if( setup.isValidSetup(self) ){
                    var params = setup.buildParams(self);
                    var newName = self.createCreep(params.parts, params.name, null);
                    if( params.name == newName || ERROR_CODE(newName) === undefined ){
                        Population.registerCreep(newName, params.setup, params.cost, self.room, self.name);
                        if(DEBUG) console.log( DYE(CRAYON.system, self.name + ' &gt; ') + DYE(CRAYON.birth, 'Good morning ' + newName + '!') );
                        return true;
                    }                     
                    console.log( DYE(CRAYON.system, self.name + ' &gt; ') + DYE(CRAYON.error, 'Offspring failed: ' + ERROR_CODE(newName)) );
                }
                return false;
            }
            _.find(this.priority, probe);
        };
        Spawn.loop = function(){      
            var loop = spawn => { 
                if( !spawn.spawning ) 
                    spawn.loop(); 
            };
            _.forEach(Game.spawns, loop);
        }
    }
};

module.exports = mod;
