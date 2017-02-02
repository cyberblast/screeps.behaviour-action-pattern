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
    if( !(drop && drop.length) ) {
        drop = creep.pos.findClosestByRange(creep.room.structures.spawns);
    }
    return drop && drop[0];
};
action.work = function(creep) {
    let range = creep.pos.getRangeTo(creep.target);
    let ret = OK;
    if( range <= action.targetRange && range > action.reachedRange &&
        creep.data.lastPos && creep.data.path && !_.eq(creep.pos, creep.data.lastPos) ) {
        // move ok, don't drop early
        return ret;
    }
    for(let resourceType in creep.carry) {
        ret = creep.drop(resourceType);
    }
    return ret;
};
action.onAssignment = function(creep, target) {
    if( SAY_ASSIGNMENT ) creep.say(String.fromCharCode(8681), SAY_PUBLIC);
};
