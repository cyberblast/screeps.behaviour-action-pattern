let mod = {};
module.exports = mod;
mod.name = 'healer';
mod.run = function(creep) {
    // Assign next Action
    let oldTargetId = creep.data.targetId;
    if( creep.action == null || ['guarding','idle'].includes(creep.action.name)) {
        this.nextAction(creep);
    }
    
    // Do some work
    if( creep.action && creep.target ) {
        creep.action.step(creep);
    } else {
        logError('Creep without action/activity!\nCreep: ' + creep.name + '\ndata: ' + JSON.stringify(creep.data));
    }
};
mod.nextAction = function(creep){
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
};
