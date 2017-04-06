let mod = {};
module.exports = mod;
mod.name = 'recycler';
mod.run = function(creep) {
    // Assign next Action
    if( !creep.action || creep.action.name != 'recycling' ) {
        delete creep.data.targetId;
        delete creep.data.path;
        this.nextAction(creep);
    }
    
    // Do some work
    if( creep.action && creep.target ) {
        creep.action.step(creep);
    } else {
        logError('Creep without action/activity!\nCreep: ' + creep.name + '\ndata: ' + JSON.stringify(creep.data));
    }
};
mod.nextAction = function(creep) {
    Creep.action.recycling.assign(creep);
};
