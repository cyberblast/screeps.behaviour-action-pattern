var Behaviour = function(typeName){
    this.name = typeName;
    this.run = function(creep) {    
        // Has assigned Action
        if( creep.memory.action ){
            if( !creep.validateMemoryAction() || creep.memory.action == 'idle' ){ // not valid anymore 
                // unregister & clear memory
                creep.unregisterAction();
            }
        }
        
        // Assign next Action
        if( !creep.memory.action ) {
            this.nextAction(creep);
        }

        // Do some work
        if( creep.action && creep.target ) {
            creep.action.step(creep);
        } 
    };
    this.nextAction = function(creep){
    };
}

module.exports = Behaviour;