module.exports = {
    name: 'melee',
    run: function(creep) {
        creep.flee = creep.flee || !creep.hasActiveOffensivePart();
        creep.attacking = false;
        creep.attackingRanged = false;
        // Assign next Action
        let oldTargetId = creep.data.targetId;
        if( creep.action == null || creep.action.name == 'idle' || ( creep.action.name == 'guarding' && (!creep.flag || creep.flag.pos.roomName == creep.pos.roomName ) ) ) {
            if( creep.data.destiny && creep.data.destiny.task && Task[creep.data.destiny.task] && Task[creep.data.destiny.task].nextAction ) 
                Task[creep.data.destiny.task].nextAction(creep);
            else this.nextAction(creep);
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

        this.heal(creep);
    },
    heal: function(creep){
        if( !creep.attacking && creep.data.body.heal !== undefined && creep.hits < creep.hitsMax ){
            creep.heal(creep);
        }
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