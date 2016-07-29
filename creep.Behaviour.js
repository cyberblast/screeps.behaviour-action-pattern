var Behaviour = function(typeName){
    this.name = typeName;
    this.validateMemoryAction = function(creep){
        creep.action = MODULES.creep.action[creep.memory.action];

        if( creep.action && creep.action.isValidAction(creep) ){
            // validate target or new
            if( !creep.action.isValidTarget(creep.target) || 
            (creep.action.maxTargetLease && (Game.time-creep.memory.targetAssignmentTime) > creep.action.maxTargetLease )){ 
                // invalid. try to find a new one...
                creep.unregisterTarget();
                var target = creep.action.newTarget(creep);
                if( target ) {
                    creep.registerTarget(target);
                    return true;
                }
            } else return true;
        } 
        return false;
    };
    this.registerAction = function(creep, action){
        if( creep.memory.action )
            creep.room.activities[creep.memory.action]--;
        creep.memory.action = action.name;
        
        if(!creep.room.activities[action])
            creep.room.activities[action] = 1;
        else creep.room.activities[action]++;
    };
    this.assignAction = function(creep, action, target){
        creep.action = action;
        if( target === undefined ) target = action.newTarget(creep);
        
        if( target != undefined ) {
            this.registerAction(creep, action);
            creep.registerTarget(target);
            return true;
        } 

        creep.unregisterTarget();
        creep.action = null;
        return false;
    };
    this.run = function(creep) {    
        // Has assigned Action
        if( creep.memory.action ){
            if( !this.validateMemoryAction(creep)|| creep.memory.action == 'idle' ){ // not valid anymore 
                // unregister & clear memory
                creep.unregisterTarget();
                creep.room.activities[creep.memory.action]--;
                creep.memory.action = null;
                creep.action = null;
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