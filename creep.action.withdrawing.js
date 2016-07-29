var action = new MODULES.creep.Action();

action.name = 'withdrawing';

action.isValidAction = function(creep){
    return ( creep.room.storage && _.sum(creep.carry) < creep.carryCapacity && 
    (creep.room.energyAvailable < creep.room.energyCapacityAvailable || 
    creep.room.towerFreeCapacity > 500 ));
};
action.isValidTarget = function(target){
    return ( (target != null) && (target.store != null) && (target.store.energy > 0) );
};  
action.maxPerTarget = 2;
action.newTarget = function(creep){
    return creep.room.storage;
};
action.work = function(creep){
    return creep.withdraw(creep.target, RESOURCE_ENERGY);
};

module.exports = action;