var action = new Creep.Action('uncharging'); // get from container
action.isAddableAction = function(creep){ return true; }
action.isAddableTarget = function(target){ return true;}
action.isValidAction = function(creep){ return _.sum(creep.carry) < creep.carryCapacity; }
action.isValidTarget = function(target){
    return ( target && target.store && target.store.energy > 0 );
};   
action.newTarget = function(creep){
    var that = this;
    let isAddable = target => that.isValidTarget(target); 
    if( creep.data.creepType == 'hauler' && creep.room.chargeablesIn.length > 0 && creep.room.chargeablesOut.length > 0 ) {
        let target = null;
        let energy = 0; 
        let fullest = o => {
            if( o.store.energy > energy ){
                energy = o.store.energy;
                target = o;
            }
        };
        _.forEach(creep.room.chargeablesIn, fullest);
        return target;
    } else if( creep.data.creepType == 'upgrader' && creep.room.chargeablesIn.length > 0 && creep.room.chargeablesOut.length > 0 ) {
        return creep.pos.findClosestByRange(creep.room.chargeablesOut, {
            filter: isAddable
        });
    } else {
        return creep.pos.findClosestByRange(creep.room.chargeables, {
            filter: isAddable
        });
    } 
};
action.work = function(creep){
    return creep.withdraw(creep.target, RESOURCE_ENERGY);
};
module.exports = action;