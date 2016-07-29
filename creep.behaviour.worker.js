var behaviour = new MODULES.creep.Behaviour();

behaviour.nextAction = function(creep){
    creep.unregisterTarget();
    
    // Last Action completed / No more energy
    if( creep.carry.energy == 0 && creep.memory.action != 'harvesting' && creep.memory.action != 'pickup' && creep.memory.action != 'withdrawing') { 

        if( _.sum(creep.carry) > creep.carry.energy ) {
            if( this.assignAction(creep, MODULES.creep.action.storing) ) 
                return;
        }
        
        var actions;
        if(creep.room.situation.invasion)
            actions = [MODULES.creep.action.withdrawing, 
                MODULES.creep.action.harvesting];
        else if(creep.room.relativeEnergyAvailable < HIVE_ENERGY_URGENT) // empty hive
            actions = [MODULES.creep.action.picking,
                MODULES.creep.action.withdrawing,
                MODULES.creep.action.harvesting];
        else  // common
            actions = [MODULES.creep.action.picking,
                MODULES.creep.action.harvesting,
                MODULES.creep.action.withdrawing];
                
        for(var iAction = 0; iAction < actions.length; iAction++) {                
            if(actions[iAction].isValidAction(creep) && 
            actions[iAction].isAddableAction(creep) && 
            this.assignAction(creep, actions[iAction]))
                return;
        }
        
        // idle
        this.assignAction(creep, MODULES.creep.action.idle);
    }
    
    else {	        
        // urgent upgrading 
        if( creep.room.ticksToDowngrade < 2000 ) {
            if( this.assignAction(creep, MODULES.creep.action.upgrading) ) 
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
            this.assignAction(creep, priority[iAction]))
                return;
        }
        
        // idle
        this.assignAction(creep, MODULES.creep.action.idle);
    }
};

module.exports = behaviour;