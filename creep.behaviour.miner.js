module.exports = {
    name: 'miner',
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
        // Last Action completed / No more energy
        if( creep.carry.energy == 0 ) { 
            priority = [
                Creep.action.harvesting];
        }
        else {	  
            priority = [
                Creep.action.charging, 
                Creep.action.storing, 
                Creep.action.feeding, 
                Creep.action.building, 
                Creep.action.repairing, 
                Creep.action.upgrading, 
                Creep.action.idle];
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
