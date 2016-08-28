module.exports = {
    name: 'ranger',
    run: function(creep) {
        let oldAction = creep.action === undefined ? 'idle' : creep.action.name;
        if( ['guarding','idle'].includes(oldAction)) { // no task assigned
            // TODO: Dont use this kind of 'action breaking'. 
            //      Add defending & invading to 'nextAction' and implement correct 'isValidAction', 'isAddableAction' and targetting rules
            //      Also check other behaviours.
            if( creep.room.situation.invasion ) {
                if( oldAction != 'defending') 
                    Creep.action.defending.assign(creep);
            } else {
                if( oldAction != 'invading' ) {
                    let flag = FlagDir.find(FLAG_COLOR.invade, creep.pos, false);
                    if( !flag ) flag = FlagDir.find(FLAG_COLOR.destroy, creep.pos, false);
                    if( flag ){
                        if( Creep.action.invading.assign(creep, flag) )
                            Population.registerCreepFlag(creep, flag);
                    }
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