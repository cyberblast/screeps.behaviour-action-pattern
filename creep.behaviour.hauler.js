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
                Creep.action.uncharging, 
                Creep.action.withdrawing, 
                Creep.action.idle];
        }    
        else {	  
            priority = [
                Creep.action.feeding, 
                Creep.action.charging, 
                Creep.action.fueling, 
                Creep.action.storing, 
                Creep.action.idle];
        }
        if( !creep.room.situation.invasion && _.sum(creep.carry) < creep.carryCapacity) {
            priority.unshift(Creep.action.picking);
        }
        if( _.sum(creep.carry) > creep.carry.energy ) {
            priority.unshift(Creep.action.storing);
        }
        if( creep.room.urgentRepairableSites.length > 0 && creep.carry.energy > 0 ) {
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
