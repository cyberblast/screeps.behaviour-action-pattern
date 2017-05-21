const mod = new Creep.Behaviour('claimer');
module.exports = mod;
const super_run = mod.run;
mod.run = function(creep) {
    super_run.call(this, creep);
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
    if( global.DEBUG && global.TRACE ) trace('Behaviour', {creepName:creep.name, run:creep.action && creep.action.name || 'none', [this.name]: 'run', Behaviour:this.name});
};
mod.actions = (creep) => {
    return [
        Creep.action.claiming,
        Creep.action.reserving,
        Creep.action.bulldozing,
    ];
};
