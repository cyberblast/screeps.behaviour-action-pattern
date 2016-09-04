var action = new Creep.Action('charging'); // store into container
action.isValidAction = function(creep){ return creep.carry.energy > 0; }
action.isAddableAction = function(creep){ return true; }
action.isValidTarget = function(target){
    return ( target && target.store && (_.sum(target.store) < target.storeCapacity) );
};   
action.isAddableTarget = function(target){ return true;}
action.newTarget = function(creep){
    var that = this;
    if( ['hauler', 'worker', 'privateer', 'pioneer'].includes(creep.data.creepType) && creep.room.chargeablesOut.length > 0 ) {
        let target = null;
        let maxFree = 0; 
        var emptyest = o => {
            let free = o.storeCapacity - _.sum(o.store);
            if( free > maxFree ){
                maxFree = free;
                target = o;
            }
        };
        _.forEach(creep.room.chargeablesOut, emptyest);
        return target;
    } else {
        let isAddable = target => that.isValidTarget(target); 
        return creep.pos.findClosestByRange(creep.room.chargeables, {
            filter: isAddable
        });
    } 
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