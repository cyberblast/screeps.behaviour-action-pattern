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
    if( ['hauler', 'worker'].includes(creep.data.creepType) && creep.room.chargeablesIn.length > 0 && creep.room.chargeablesOut.length > 0 ) {
        // take from fullest IN container 
        let target = null;
        let energy = 0; 
        let fullest = o => {
            let count = o.targetOf ? _.countBy(o.targetOf, 'creepType')['hauler'] : 0;
            let e = o.store.energy / (count ? count+1 : 1);
            if( e  > energy ){
                energy = e ;
                target = o;
            }
        };
        _.forEach(creep.room.chargeablesIn, fullest);
        return target;
    } else if( creep.data.creepType == 'upgrader' && creep.room.chargeablesIn.length > 0 && creep.room.chargeablesOut.length > 0 ) {
        // take from OUT container
        return creep.pos.findClosestByRange(creep.room.chargeablesOut, {
            filter: isAddable
        });
    } else {
        // take from any container
        return creep.pos.findClosestByRange(creep.room.chargeables, {
            filter: isAddable
        });
    } 
};
action.work = function(creep){
    return creep.withdraw(creep.target, RESOURCE_ENERGY);
};
module.exports = action;