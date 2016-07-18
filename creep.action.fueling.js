var action = new MODULES.creep.Action();

action.name = 'fueling';

action.isValidAction = function(creep){
    return ( creep.carry.energy > 0 && creep.room.towerFreeCapacity > 0 );
};
action.isValidTarget = function(target){
    return ( (target != null) && (target.energy != null) && (target.energy < target.energyCapacity) );
};   
action.newTarget = function(creep){
    var self = this;
    var t = creep.room.towers.find(function(tower) { // TODO: include Nuker
        return tower.energy < tower.energyCapacity && self.isAddableTarget(tower);
    });
    return t;
};
action.isAddableTarget = function(target){ 
    return (this.maxPerTarget > 0 && (!target.creeps || !target.creeps[maxPerTargetType] || target.creeps[maxPerTargetType].length < this.maxPerTarget)) && 
    ((target.energy < target.energyCapacity * (1-(0.16/target.room.towers.length))) || target.room.situation.invasion);
};

action.work = function(creep){
    return creep.transfer(creep.target, RESOURCE_ENERGY);
};

module.exports = action;