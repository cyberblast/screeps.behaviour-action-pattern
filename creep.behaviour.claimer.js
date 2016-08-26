module.exports = {
    name: 'claimer',
    run: function(creep) {
        if( !creep.flag ) {
            let flag = FlagDir.find(FLAG_COLOR.claim, creep.pos, false, FlagDir.rangeMod);
            if( flag ) { 
                Population.registerCreepFlag(creep, flag);
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
        if( !creep.flag || !Creep.action.claiming.assign(creep) )
            Creep.action.idle.assign(creep);
        return;
    }
}