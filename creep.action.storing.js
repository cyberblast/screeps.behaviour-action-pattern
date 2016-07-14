var action = _.cloneDeep(require('creep.action'));

action.name = 'storing';

action.isValidAction = function(creep){
    return ( _.sum(creep.carry) > 0 && creep.room.storage != null && 
    ( _.sum(creep.carry) > creep.carry.energy || (
    (creep.room.activities.upgrading != null && (creep.room.activities.upgrading >= 2)) &&
    creep.room.sourceEnergyAvailable > 0)));
};
action.isValidTarget = function(target){
    return ((target != null) && (target.store != null) && target.sum < target.storeCapacity);
};   
action.maxPerTarget = 2;
action.newTarget = function(creep){
    if( this.isValidTarget(creep.room.storage) && this.isAddableTarget(creep.room.storage) )
        return creep.room.storage;
    return null;
};
action.work = function(creep){
    var workResult;
    for(var resourceType in creep.carry) {
        workResult = creep.transfer(creep.target, resourceType);
        if( workResult != OK ) break;
    }
    return workResult;
};

module.exports = action;