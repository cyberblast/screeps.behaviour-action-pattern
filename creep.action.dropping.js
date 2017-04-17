const action = class extends Creep.Action {
    
    constructor(...args) {
        super(...args);
        
        this.reachedRange = 0;
    }
    
    isValidAction(creep) {
        return creep.sum > 0;
    }
    
    newTarget(creep) {
        // drop off at drop pile or the nearest spawn
        return creep.pos.findClosestByRange(creep.room.structures.piles) ||
                creep.pos.findClosestByRange(creep.room.structures.spawns) ||
                creep.pos.findClosestByRange(creep.room.find(FIND_FLAGS, FlagDir.flagFilter(FLAG_COLOR.claim.spawn))) ||
                creep.pos.findClosestByRange(_.filter(creep.room.constructionSites, {structureType: STRUCTURE_SPAWN})) ||
                creep.room.controller;
    }
    
    work(creep) {
        let ret = OK;
        const isSpawnFlag = f => f && Flag.compare(f, FLAG_COLOR.claim.spawn);
        if (!(creep.target instanceof StructureSpawn || creep.target instanceof ConstructionSite ||
            creep.target instanceof StructureController || isSpawnFlag(creep.target))) {
            let range = creep.pos.getRangeto(creep.target);
            if (range > 0 && creep.data.lastPos && creep.data.path && !_.isEqual(creep.pos, creep.data.lastPos)) {
                // If the destination is walkable, try to move there before dropping
                const invalidObject = o => {
                    return ((o.type === LOOK_TERRAIN && o.terrain === 'wall') ||
                    o.type === LOOK_CREEPS ||
                    (o.type === LOOK_STRUCTURES && OBSTACLE_OBJECT_TYPES.includes(o.structure.structureType)));
                };
                let look = creep.room.lookAt(target);
                if (!_.some(look, invalidObject)) {
                    return ret;
                }
            }
        }
        for (const resourceType in creep.carry) {
            ret = creep.drop(resourceType);
        }
        return ret;
    }
    
};
module.exports = new action('dropping');