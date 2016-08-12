var Behaviour = function(typeName){
    this.name = typeName;
    this.run = function(creep) {
        // Has assigned Action
        let action;
        if( !creep.validateMemoryAction() ){ // not valid anymore 
            creep.action = null;
            action = null;
        } else action = creep.action;

        // Assign next Action
        if( action == null ) {
            this.nextAction(creep);
            action = creep.action;
        }

        // Do some work
        if( action && creep.target ) {
            creep.action.step(creep);
        } 
    };
    this.run.displayName = "creep.Behaviour.run";
    this.nextAction = function(creep){
    };
    this.nextAction.displayName = "creep.Behaviour.nextAction";
}

module.exports = Behaviour;