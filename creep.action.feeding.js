var action = _.cloneDeep(require('creep.action'));

action.name = 'feeding';
action.isValidAction = function(creep){
    return ( creep.carry.energy > 0 && creep.room.energyAvailable < creep.room.energyCapacityAvailable );
};
action.isValidTarget = function(target){
    return ( (target != null) && (target.energy != null) && (target.energy < target.energyCapacity) );
};   
action.maxPerTarget = 1;
action.newTarget = function(creep){
    var self = this;
    var target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: (structure) => {
            return ((structure.structureType == STRUCTURE_EXTENSION || 
                structure.structureType == STRUCTURE_SPAWN ) 
                && self.isValidTarget(structure) && self.isAddableTarget(structure));
        }
    });

    return target;
};
action.work = function(creep){
    return creep.transfer(creep.target, RESOURCE_ENERGY);
};

module.exports = action;