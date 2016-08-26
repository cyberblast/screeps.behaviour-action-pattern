module.exports = {
    name: 'healer',
    run: function(creep) {
        if( creep.room.situation.invasion && (!creep.action || creep.action.name != 'healing') )
            Creep.action.healing.assign(creep);
        else {
            if( !creep.flag ) {
                let flag = FlagDir.find(FLAG_COLOR.invade, creep.pos, false);
                if( flag ){
                    if( Creep.action.travelling.assign(creep, flag) )
                        Population.registerCreepFlag(creep, flag);
                }
            }
        }
        // Assign next Action
        if( creep.action == null ) {
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
            Creep.action.healing, 
            Creep.action.guarding, 
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
    }
}