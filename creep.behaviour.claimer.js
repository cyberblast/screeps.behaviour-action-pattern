const mod = new Creep.Behaviour('claimer');
module.exports = mod;
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
                let room = Game.rooms[creep.data.nearestHome];
                if (room) {
                    let range = creep.pos.getRangeTo(room.controller);
                    if (range > 1) creep.travelTo( room.controller.pos );
                }
            }
        }
    }
    if( DEBUG && TRACE ) trace('Behaviour', {creepName:creep.name, run:creep.action && creep.action.name || 'none', [mod.name]: 'run', Behaviour:mod.name});
};
mod.actions = (creep) => {
    return [
        Creep.action.claiming,
        Creep.action.reserving,
        Creep.action.bulldozing,
    ];
};
