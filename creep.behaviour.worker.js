module.exports = {
    name: 'worker',
    run: function(creep) {
        // Assign next Action
        let oldTargetId = creep.data.targetId;
        if( creep.action == null || creep.action.name == 'idle' ) {
            this.nextAction(creep);
        }
        if( creep.data.targetId != oldTargetId ) {
            delete creep.data.path;
        }
        // Do some work
        if( creep.action && creep.target ) {
            creep.action.step(creep);
        } else {
            logError('Creep without action/activity!\nCreep: ' + creep.name + '\ndata: ' + JSON.stringify(creep.data));
        }
    },
    nextAction: function(creep){
        let priority;
        if( creep.carry.energy == 0 ) { 
            priority = [
                Creep.action.picking,
                Creep.action.withdrawing, 
                Creep.action.uncharging, 
                Creep.action.dismantling,
                Creep.action.harvesting, 
                Creep.action.idle];
        }    
        else {                
            if( creep.room.situation.invasion ){
                priority = [
                    Creep.action.picking,
                    Creep.action.fueling, 
                    Creep.action.feeding, 
                    Creep.action.repairing, 
                    Creep.action.idle];
            } else {
                priority = [
                    Creep.action.repairing, 
                    Creep.action.building, 
                    Creep.action.feeding, 
                    Creep.action.fueling, 
                    Creep.action.upgrading, 
                    Creep.action.storing, 
                    Creep.action.idle];
            }
            if( creep.room.relativeEnergyAvailable < 1 && (!creep.room.population || !creep.room.population.typeCount['hauler'] || creep.room.population.typeCount['hauler'] < 1) ) { 
                priority.unshift(Creep.action.feeding);
            }
            if( creep.room.controller && creep.room.controller.ticksToDowngrade < 2000 ) { // urgent upgrading 
                priority.unshift(Creep.action.upgrading);
            }
        }
        if( _.sum(creep.carry) > creep.carry.energy ) {
            priority.unshift(Creep.action.storing);
        }
        for(var iAction = 0; iAction < priority.length; iAction++) {
            var action = priority[iAction];
            if(action.isValidAction(creep) && 
                action.isAddableAction(creep) && 
                action.assign(creep)) {
                    return;
            }
        }
    }
}
