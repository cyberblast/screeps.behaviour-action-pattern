module.exports = {
    name: 'upgrader',
    run: function(creep) {
        if( !creep.target ){
            let cont = creep.room.controller.pos.findInRange(creep.room.chargeablesOut, 3 ); // or storage
            if( cont.length > 0 ) {
                Population.registerAction(creep, Creep.action.upgrading, cont[0]);
            }
        }

        // Do some work
        if( creep.action && creep.target ) {
            creep.action.step(creep);
        } else {
            // logError('Creep without action/activity!\nCreep: ' + creep.name + '\ndata: ' + JSON.stringify(creep.data));
        }
    },
    nextAction: function(creep){
        let priority;
        if( creep.carry.energy == 0 ) { 
            priority = [
                Creep.action.uncharging];
        }    
        else {	  
            priority = [
                Creep.action.upgrading];
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
