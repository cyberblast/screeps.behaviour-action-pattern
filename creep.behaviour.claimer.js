module.exports = {
    name: 'claimer',
    run: function(creep) {
        /*
        if( !creep.flag ) {
            let flag = FlagDir.find(FLAG_COLOR.claim, creep.pos, false, FlagDir.rangeMod);
            if( flag ) { 
                Population.registerCreepFlag(creep, flag);
            }
        } else if( creep.flag.pos.roomName == creep.pos.roomName ){
            creep.data.targetId = null;
        }*/
        // Assign next Action
        if( creep.action == null || creep.action.name == 'idle') {
            this.nextAction(creep);
        }
        // Do some work
        if( creep.action && creep.target ) {
            creep.action.step(creep);
        } else {
            logError('Creep without action/activity!\nCreep: ' + creep.name + '\ndata: ' + JSON.stringify(creep.data));
        }
    },
    nextAction: function(creep){ 
        let priority = [
            Creep.action.claiming, 
            Creep.action.idle
        ];
        for(var iAction = 0; iAction < priority.length; iAction++) {
            var action = priority[iAction];
            if(action.isValidAction(creep) && 
                action.isAddableAction(creep) && 
                action.assign(creep)) {
                    return;
            }
        }
        /*
        if( !creep.flag || !Creep.action.claiming.assign(creep) )
            Creep.action.idle.assign(creep);
        return;*/        
    }
}