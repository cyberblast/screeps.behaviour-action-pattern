var action = new Creep.Action('fueling');
action.isValidAction = function(creep){
    return ( creep.carry.energy > 0 && creep.room.towerFreeCapacity > 0 );
};
action.isValidTarget = function(target){
    return ( (target != null) && (target.energy != null) && (target.energy < target.energyCapacity) );
};   
action.newTarget = function(creep){
    return creep.room.fuelables.length > 0 ? creep.room.fuelables[0] : null;
};
action.work = function(creep){
    let response = creep.transfer(creep.target, RESOURCE_ENERGY);
    if( creep.target.energyCapacity - creep.target.energy < 20 ) 
        creep.data.targetId = null;
    return response;
};
module.exports = action;