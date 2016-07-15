var action = new MODULES.creep.ability();

action.name = 'fueling';
action.isValidAction = function(creep){
    return ( creep.carry.energy > 0 && creep.room.towerFreeCapacity > 0 );
};
action.isValidTarget = function(target){
    return ( (target != null) && (target.energy != null) && (target.energy < target.energyCapacity) );
};   
action.newTarget = function(creep){
    var self = this;
    return creep.room.towers.find(function(tower) { // TODO: include Nuker
        tower.energy < tower.energyCapacity && self.isAddableTarget(tower) 
    });
};
action.work = function(creep){
    return creep.transfer(creep.target, RESOURCE_ENERGY);
};

module.exports = action;