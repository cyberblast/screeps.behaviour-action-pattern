var action = new Creep.Action('upgrading');
action.targetRange = 3;
action.isAddableAction = function(creep){ return true; },
action.isAddableTarget = function(target){ return true; }, 
action.isValidAction = function(creep){
    return creep.carry.energy > 0 && creep.room.sourceEnergyAvailable > 0;
};
action.isValidTarget = function(target){
    return (target != null ) && ( target.progress != null );
};   
action.newTarget = function(creep){
    return creep.room.controller;
};
action.work = function(creep){
    return creep.upgradeController(creep.target);
};
module.exports = action;