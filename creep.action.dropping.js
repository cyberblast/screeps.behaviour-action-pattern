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
    if( !drop ) {
        drop = creep.pos.findClosestByRange(creep.room.find(FIND_FLAGS, FlagDir.flagFilter(FLAG_COLOR.claim.spawn)));
    }
    if (!drop) {
        drop = creep.pos.findClosestByRange(_.filter(creep.room.constructionSites, {structureType: STRUCTURE_SPAWN}));
    }
    if (!drop) {
        drop = creep.room.controller;
    }
    return drop;
};
action.work = function(creep) {
    let ret = OK;
    let isSpawnFlag = f => f && Flag.compare(f, FLAG_COLOR.claim.spawn);
    if (!(creep.target instanceof StructureSpawn || creep.target instanceof ConstructionSite
        || creep.target instanceof StructureController || isSpawnFlag(creep.target))) {
        let range = creep.pos.getRangeTo(creep.target);
        if( range > 0 && creep.data.lastPos && creep.data.path && !_.eq(creep.pos, creep.data.lastPos) ) {
            // If the destination is walkable, try to move there before dropping
            let invalidObject = o => {
                return ((o.type == LOOK_TERRAIN && o.terrain == 'wall') ||
                     o.type == LOOK_CREEPS ||
                    (o.type == LOOK_STRUCTURES && OBSTACLE_OBJECT_TYPES.includes(o.structure.structureType) ));
            };
            let look = creep.room.lookAt(target);
            if (!_.some(look, invalidObject)) {
                return ret;
            }
        }
    }
    for(let resourceType in creep.carry) {
        ret = creep.drop(resourceType);
    }
    return ret;
};
