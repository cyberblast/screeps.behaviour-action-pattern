var work = {
    run: function(creep) {
        if( !creep.room.storage || creep.room.storage.energy == 0 ){
            MODULES.creep.assignActionWithTarget(creep, MODULES.creep.action.idle);
            creep.action.step(creep);
            return;
        }
        
        // Has assigned Action
        if( creep.memory.action ){
            if( !MODULES.creep.validateMemoryAction(creep) ){
                creep.room.activities[creep.memory.action]--;
                creep.memory.action = null;
                creep.memory.target = null;
                creep.action = null;
                creep.target = null;
            }
        }

        // Assign next Action
        if( !creep.memory.action ) {
            this.nextAction(creep);
        }

        // Do some work
        if( creep.action && creep.target ) {                
            if( creep.carry.energy == 0 && !['pickup', 'idle'].includes(creep.memory.action)) {
                creep.target = creep.room.storage;
                MODULES.creep.action.withdrawing.step(creep);
            } else {
                creep.action.step(creep);
            }
        } 
    }, 
    nextAction: function(creep){
        creep.memory.target = null;
        creep.target = null;

        var actions = creep.room.situation.invasion ?
        [MODULES.creep.action.storing,
            MODULES.creep.action.feeding, 
            MODULES.creep.action.fueling, 
            MODULES.creep.action.repairing] : 
        [MODULES.creep.action.storing,
            MODULES.creep.action.picking,
            MODULES.creep.action.feeding, 
            MODULES.creep.action.repairing];
        
        for(var iAction = 0; iAction < actions.length; iAction++) {            
            if(actions[iAction].isValidAction(creep) && 
            actions[iAction].isAddableAction(creep) && 
            MODULES.creep.assignActionWithTarget(creep, actions[iAction]))
                return;
        }
        
        // idle
        MODULES.creep.assignActionWithTarget(creep, MODULES.creep.action.idle);
    }
};

module.exports = work;