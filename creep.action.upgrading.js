var action = _.cloneDeep(require('creep.action'));

action.name = 'upgrading';

action.isValidAction = function(creep){
    return (target != null ) && ( target.progress != null );
};
action.isValidTarget = function(target){
    return ((target != null) && (target.store != null) && target.sum < target.storeCapacity);
};   
action.isAddableAction = function(creep){
    return true;
},
action.isAddableTarget = function(target){ 
    return true;
}, 
action.newTarget = function(creep){
    return creep.room.controller;
};
action.work = function(creep){
    return creep.upgradeController(creep.target);
};

module.exports = action;