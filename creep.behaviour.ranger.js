module.exports = {
    name: 'ranger',
    run: function(creep) {
        // Assign next Action
        //creep.attacking = false;
        creep.attackingRanged = false;
        let oldTargetId = creep.data.targetId;
        if( creep.action == null || creep.action.name == 'idle' || ( creep.action.name == 'guarding' && (!creep.flag || creep.flag.pos.roomName == creep.pos.roomName ) ) ) {
            this.nextAction(creep);
        }
        // TODO: if hits < 15% or < 400 flee
        if( creep.data.targetId != oldTargetId ) {
            delete creep.data.path;
        }
        // Do some work
        if( creep.action && creep.target ) {
            creep.action.step(creep);
        } else {
            logError('Creep without action/activity!\nCreep: ' + creep.name + '\ndata: ' + JSON.stringify(creep.data));
        }

        // Heal self
        if( creep.data.body.heal !== undefined && creep.hits < creep.hitsMax ){
            creep.heal(creep);
        }
        // Heal other
        else if( !creep.attackingRanged && creep.room.casualties.length > 0 ){
            let injured = creep.pos.findInRange(creep.room.casualties, 3);
            if( injured.length > 0 ){
                if(creep.pos.isNearTo(injured[0])) {
                    creep.heal(injured[0]);
                }
                else {
                    creep.rangedHeal(injured[0]);
                }
            }
        }
        if( creep.flee ) if( SAY_ASSIGNMENT ) creep.say(String.fromCharCode(9855), SAY_PUBLIC); 
    },
    nextAction: function(creep){ 
        let priority = [
            Creep.action.defending,
            Creep.action.invading, 
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