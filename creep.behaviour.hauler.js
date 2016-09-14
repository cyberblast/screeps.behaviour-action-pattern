module.exports = {
    name: 'hauler',
    run: function(creep) {
        // Assign next Action
        let oldTargetId = creep.data.targetId;
        if( creep.action == null || creep.action.name == 'idle' ) {
            this.nextAction(creep);
        }
        if( creep.data.targetId != oldTargetId ) {
            creep.data.moveMode = null;
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
                Creep.action.uncharging, 
                Creep.action.withdrawing, 
                Creep.action.idle];
        }    
        else {	  
            priority = [
                Creep.action.picking,
                Creep.action.feeding, 
                Creep.action.charging, 
                Creep.action.fueling, 
                Creep.action.storing, 
                Creep.action.idle];
            if( creep.room.controller && creep.room.controller.ticksToDowngrade < 2000 ) { // urgent upgrading 
                priority.unshift(Creep.action.upgrading);
            }
        }
        if( _.sum(creep.carry) > creep.carry.energy ) {
            priority.unshift(Creep.action.storing);
        }

        if (!creep.room.situation.invasion && DEFCON > 1 && creep.carry.energy > 0 && creep.room.storage) {
            let defensiveFlags = FlagDir.count(FLAG_COLOR.defense);
            // if (DEBUG) console.log('DEFCON - HAULER NEXT ACTION - Defensive Flags: ' + defensiveFlags);
            if (defensiveFlags > 0) {
                let storeNeeded = (Creep.setup.melee.maxCost() + Creep.setup.ranger.maxCost()) * defensiveFlags;
                storeNeeded +=  storeNeeded * 0.10; // Add buffer
                // if (DEBUG) console.log('DEFCON - HAULER NEXT ACTION - Stored energry needed to avoid creating defensive units: ' + storeNeeded);
                if (creep.room.storage.store.energy < storeNeeded) {
                    // if (DEBUG) console.log('DEFCON - HAULER NEXT ACTION - We need more stored energy. We are prioritizing the storing of energy. ');
                    priority.unshift(Creep.action.storing);
                }
            }
        }

        if (creep.room.urgentRepairableSites.length > 0 && creep.carry.energy > 0) {
            priority.unshift(Creep.action.fueling);
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
