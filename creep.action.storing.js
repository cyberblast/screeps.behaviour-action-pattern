var action = new MODULES.creep.Action();

action.name = 'storing';

action.isValidAction = function(creep){
    return ( creep.room.storage != null && _.sum(creep.carry) > 0 && 
    ( _.sum(creep.carry) > creep.carry.energy || (
    (creep.room.activities.upgrading != null && (creep.room.activities.upgrading >= 1)) &&
    creep.room.sourceEnergyAvailable > 0 && creep.room.storage.store.energy < 500001)));
};
action.isValidTarget = function(target){
    return ((target != null) && (target.store != null) && target.sum < target.storeCapacity);
};   
action.maxPerTarget = 1;
action.newTarget = function(creep){
    if( this.isValidTarget(creep.room.storage) && this.isAddableTarget(creep.room.storage) )
        return creep.room.storage;
    return null;
};
action.work = function(creep){
    var workResult;
    for(var resourceType in creep.carry) {
        if( creep.carry[resourceType] > 0 ){
            workResult = creep.transfer(creep.target, resourceType);
            if( workResult != OK ) break;
        }
    }
    return workResult;
};

module.exports = action;