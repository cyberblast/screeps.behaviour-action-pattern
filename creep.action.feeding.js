let action = new Creep.Action('feeding');
module.exports = action;
action.maxPerTarget = 1;
action.isValidAction = function(creep){
    return ( creep.carry.energy > 0 && creep.room.energyAvailable < creep.room.energyCapacityAvailable );
};
action.isValidTarget = function(target){
    return ( (target) && (target.energy) && target.isActive() && (target.energy < target.energyCapacity) );
};
action.isAddableTarget = function(target){
    return ( target.my &&
        (!target.targetOf || _.filter(target.targetOf, {'actionName':'feeding'}).length < this.maxPerTarget));
};
action.newTarget = function(creep){
    if (creep.room.energyAvailable === creep.room.energyCapacityAvailable) {
        return null;
    }
    return creep.pos.findClosestByRange(creep.room.structures.feedable, {
        filter: (structure) => {
            return action.isValidTarget(structure) && action.isAddableTarget(structure, creep);
        }
    });
};
action.work = function(creep){
    let result = creep.transfer(creep.target, RESOURCE_ENERGY);
    if (result == OK && creep.carry.energy > creep.target.energyCapacity-creep.target.energy) {
        creep.target = null;
        this.assign(creep);
    }
    return result;
};