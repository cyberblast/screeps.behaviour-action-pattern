var action = new Creep.Action('feeding');
action.isValidAction = function(creep){
    return ( creep.carry.energy > 0 && creep.room.energyAvailable < creep.room.energyCapacityAvailable );
};
action.isValidTarget = function(target){
    return ( (target != null) && (target.energy != null) && (target.energy < target.energyCapacity) );
};   
action.isAddableAction = function(creep){
    return true;//(!creep.room.population.actionCount[this.name] || creep.room.population.actionCount[this.name] < (creep.room.maxPerJob * (creep.room.relativeEnergyAvailable < HIVE_ENERGY_URGENT ? 2 : 1)) );
};
action.newTarget = function(creep){
    var that = this;
    return creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: (structure) => {
            return ((structure.structureType == STRUCTURE_EXTENSION || 
                structure.structureType == STRUCTURE_SPAWN ) 
                && that.isValidTarget(structure) && that.isAddableTarget(structure));
        }
    });
};
action.work = function(creep){
    return creep.transfer(creep.target, RESOURCE_ENERGY);
};
module.exports = action;