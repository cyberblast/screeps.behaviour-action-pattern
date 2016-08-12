var action = new Creep.Action('fueling');
action.isValidAction = function(creep){
    return ( creep.carry.energy > 0 && creep.room.towerFreeCapacity > 0 );
};
action.isValidTarget = function(target){
    return ( (target != null) && (target.energy != null) && (target.energy < target.energyCapacity) );
};   
action.isAddableTarget = function(target){ 
    return (this.maxPerTarget > 0 && (!target.creeps || !target.creeps[this.maxPerTargetType] || target.creeps[this.maxPerTargetType].length < this.maxPerTarget));
};
action.newTarget = function(creep){
    var self = this;
    var isAddable = target => self.isAddableTarget(target);
    return _.find(creep.room.fuelables, isAddable);
};
action.work = function(creep){
    return creep.transfer(creep.target, RESOURCE_ENERGY);
};
module.exports = action;