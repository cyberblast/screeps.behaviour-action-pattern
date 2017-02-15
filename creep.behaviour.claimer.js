let mod = {};
module.exports = mod;
mod.name = 'claimer';
mod.run = function(creep) {
    // Assign next Action
    let oldTargetId = creep.data.targetId;
    if( creep.action == null || creep.action.name == 'idle') {
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
    if( creep.hits < creep.hitsMax ) { // creep injured. move to next owned room
        if (creep.data) {
            if (!creep.data.nearestHome || !Game.rooms[creep.data.nearestHome]) creep.data.nearestHome = Room.bestSpawnRoomFor(creep.pos.roomName);
            if (creep.data.nearestHome) {
                let c = Game.rooms[creep.data.nearestHome].controller;
                let range = creep.pos.getRangeTo(c);
                if (range > 1) creep.travelTo( c.pos );
            }
        }
    }
    if( DEBUG && TRACE ) trace('Behaviour', {creepName:creep.name, run:creep.action.name, [mod.name]: 'run', Behaviour:mod.name});
};
mod.nextAction = function(creep){
    let priority = [
        Creep.action.claiming,
        Creep.action.reserving,
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
