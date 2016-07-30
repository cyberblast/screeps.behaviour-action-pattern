var behaviour = new Creep.Behaviour('worker');

behaviour.nextAction = function(creep){
    creep.unregisterTarget();
    
    // Last Action completed / No more energy
    if( creep.carry.energy == 0 && creep.memory.action != 'harvesting' && creep.memory.action != 'pickup' && creep.memory.action != 'withdrawing') { 

        if( _.sum(creep.carry) > creep.carry.energy ) {
            if( this.assignAction(creep, Creep.action.storing) ) 
                return;
        }
        
        var actions;
        if(creep.room.situation.invasion)
            actions = [Creep.action.withdrawing, 
                Creep.action.harvesting];
        else if(creep.room.relativeEnergyAvailable < HIVE_ENERGY_URGENT) // empty hive
            actions = [Creep.action.picking,
                Creep.action.withdrawing,
                Creep.action.harvesting];
        else  // common
            actions = [Creep.action.picking,
                Creep.action.harvesting,
                Creep.action.withdrawing];
                
        for(var iAction = 0; iAction < actions.length; iAction++) {                
            if(actions[iAction].isValidAction(creep) && 
            actions[iAction].isAddableAction(creep) && 
            this.assignAction(creep, actions[iAction]))
                return;
        }
        
        // idle
        this.assignAction(creep, Creep.action.idle);
    }
    
    else {	        
        // urgent upgrading 
        if( creep.room.ticksToDowngrade < 2000 ) {
            if( this.assignAction(creep, Creep.action.upgrading) ) 
                return;
        }
        
        var priority;
        if( creep.room.situation.invasion ) priority = [
            Creep.action.feeding, 
            Creep.action.fueling, 
            Creep.action.repairing, 
            Creep.action.building, 
            Creep.action.storing, 
            Creep.action.upgrading];
        else priority = [
            Creep.action.picking,
            Creep.action.feeding, 
            Creep.action.repairing, 
            Creep.action.building, 
            Creep.action.fueling, 
            Creep.action.storing, 
            Creep.action.upgrading];
        
        for(var iAction = 0; iAction < priority.length; iAction++) {
            
            if(priority[iAction].isValidAction(creep) && 
            priority[iAction].isAddableAction(creep) && 
            this.assignAction(creep, priority[iAction]))
                return;
        }
        
        // idle
        this.assignAction(creep, Creep.action.idle);
    }
};

module.exports = behaviour;