let action = new Creep.Action('dropping');
module.exports = action;
action.targetRange = 1;
action.reachedRange = 0;
action.isValidAction = function(creep){
    return creep.sum > 0;
};
action.newTarget = function(creep) {
    // drop off at drop pile or the nearest spawn
    let drop = creep.pos.findClosestByRange(creep.room.structures.piles);
    if( !drop ) {
        drop = creep.pos.findClosestByRange(creep.room.structures.spawns);
    }
    return drop;
};
action.work = function(creep) {
    let ret = OK;
    if !(creep.target instanceof StructureSpawn) {
        let range = creep.pos.getRangeTo(creep.target);
        if( range > action.reachedRange && creep.data.lastPos && creep.data.path
            && !_.eq(creep.pos, creep.data.lastPos) ) {
            // move ok, don't drop early
            return ret;
        }
    }
    for(let resourceType in creep.carry) {
        ret = creep.drop(resourceType);
    }
    return ret;
};
action.onAssignment = function(creep, target) {
    if( SAY_ASSIGNMENT ) creep.say(String.fromCharCode(8681), SAY_PUBLIC);
};
