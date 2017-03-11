let mod = {};
module.exports = mod;
mod.name = 'melee';
mod.run = function(creep) {
    creep.flee = creep.flee || !creep.hasActiveBodyparts([ATTACK, RANGED_ATTACK]);
    creep.attacking = false;
    creep.attackingRanged = false;
    // Assign next Action
    let oldTargetId = creep.data.targetId;
    if (!creep.action || creep.action.name === 'idle' ||
        (creep.action.name === 'guarding' &&
            (!creep.flag || creep.flag.pos.roomName === creep.pos.roomName || creep.leaveBorder())
        )
    ) {
        if( creep.data.destiny && creep.data.destiny.task && Task[creep.data.destiny.task] && Task[creep.data.destiny.task].nextAction ) 
            Task[creep.data.destiny.task].nextAction(creep);
        else this.nextAction(creep);
    }
    
    // Do some work
    if( creep.action && creep.target ) {
        creep.action.step(creep);
    } else {
        logError('Creep without action/activity!\nCreep: ' + creep.name + '\ndata: ' + JSON.stringify(creep.data));
    }

    this.heal(creep);
};
mod.heal = function(creep){
    if( !creep.attacking && creep.data.body.heal !== undefined && creep.hits < creep.hitsMax ){
        creep.heal(creep);
    }
};
mod.nextAction = function(creep){
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
};
