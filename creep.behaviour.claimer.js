const mod = new Creep.Behaviour('claimer');
module.exports = mod;
mod.run = function(creep) {
    Creep.Behaviour.run(creep);
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
