var action = new Creep.Action('storing');
action.maxPerTarget = 4;
action.maxPerAction = 4;
action.isValidAction = function(creep){
    return ( 
        creep.room.storage != null && 
        _.sum(creep.carry) > 0 && 
        (
            creep.data.creepType == 'hauler' || 
            creep.data.creepType == 'privateer' ||
            ( 
                _.sum(creep.carry) > creep.carry.energy || 
                (
                    (
                        !creep.room.population || 
                        (
                            creep.room.population.actionCount.upgrading != null && 
                            creep.room.population.actionCount.upgrading >= 1
                        )
                    ) &&
                    creep.room.sourceEnergyAvailable > 0 && 
                    creep.room.storage.store.energy <= LIMIT_STORAGE_ENERGY
                )
            )
        )
    );
};
action.isValidTarget = function(target){
    return ((target != null) && (target.store != null) && target.sum < target.storeCapacity);
};   
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