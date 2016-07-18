var behaviour = new MODULES.creep.Behaviour();

behaviour.run = function(creep) {
    // Harvesting completed / energy refilled
    if(creep.memory.action == 'idle' || (_.sum(creep.carry) == creep.carryCapacity && (creep.memory.action == 'harvesting' || creep.memory.action == 'pickup' || creep.memory.action == 'withdrawing'))) {
        creep.unregisterTarget();
        creep.memory.action = null;
    } 

    // Has assigned Action
    if( creep.memory.action ){
        if( !this.validateMemoryAction(creep) ){
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

behaviour.nextAction = function(creep){
    creep.unregisterTarget();
    
    // Last Action completed / No more energy
    if( creep.carry.energy == 0 && creep.memory.action != 'harvesting' && creep.memory.action != 'pickup' && creep.memory.action != 'withdrawing') { 
        if( creep.memory.action != null ) creep.room.activities[creep.memory.action]--;
        
        if( _.sum(creep.carry) > creep.carry.energy ) {
            if( this.assignActionWithTarget(creep, MODULES.creep.action.storing) ) 
                return;
        }
        
        var actions = creep.room.situation.invasion ?
        [MODULES.creep.action.withdrawing,
            MODULES.creep.action.harvesting] : 
        [MODULES.creep.action.picking,
            MODULES.creep.action.harvesting,
            MODULES.creep.action.withdrawing];
            
        for(var iAction = 0; iAction < actions.length; iAction++) {                
            if(actions[iAction].isValidAction(creep) && 
            actions[iAction].isAddableAction(creep) && 
            this.assignActionWithTarget(creep, actions[iAction]))
                return;
        }
        
        // idle
        this.assignActionWithTarget(creep, MODULES.creep.action.idle);
    }
    
    else {	        
        // urgent upgrading 
        if( creep.room.ticksToDowngrade < 2000 ) {
            if( this.assignActionWithTarget(creep, MODULES.creep.action.upgrading) ) 
                return;
        }
        
        var priority;
        if( creep.room.situation.invasion ) priority = [
            MODULES.creep.action.feeding, 
            MODULES.creep.action.fueling, 
            MODULES.creep.action.repairing, 
            MODULES.creep.action.building, 
            MODULES.creep.action.storing, 
            MODULES.creep.action.upgrading];
        else priority = [
            MODULES.creep.action.picking,
            MODULES.creep.action.feeding, 
            MODULES.creep.action.repairing, 
            MODULES.creep.action.building, 
            MODULES.creep.action.fueling, 
            MODULES.creep.action.storing, 
            MODULES.creep.action.upgrading];
        
        for(var iAction = 0; iAction < priority.length; iAction++) {
            
            if(priority[iAction].isValidAction(creep) && 
            priority[iAction].isAddableAction(creep) && 
            this.assignActionWithTarget(creep, priority[iAction]))
                return;
        }
        
        // idle
        this.assignActionWithTarget(creep, MODULES.creep.action.idle);
    }
};

module.exports = behaviour;