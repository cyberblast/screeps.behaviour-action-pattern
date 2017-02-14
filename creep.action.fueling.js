let action = new Creep.Action('fueling');
module.exports = action;
action.maxPerTarget = 1;
action.maxPerAction = 1;
action.isValidAction = function(creep){
    return ( creep.carry.energy > 0 && creep.room.towerFreeCapacity > 0 );
};
action.isValidTarget = function(target){
    return ( (target != null) && (target.energy != null) && (target.energy < target.energyCapacity) );
};
action.isAddableTarget = function(target){
    return ( target.my &&
        (!target.targetOf || target.targetOf.length < this.maxPerTarget));
};
action.newTarget = function(creep){
    return creep.room.structures.fuelable.length > 0 ? creep.room.structures.fuelable[0] : null;
};
action.work = function(creep){
    let response = creep.transfer(creep.target, RESOURCE_ENERGY);
    if( creep.target.energyCapacity - creep.target.energy < 20 )
        creep.data.targetId = null;
    return response;
};
action.onAssignment = function(creep, target) {
    if( SAY_ASSIGNMENT ) creep.say('\u{26FD}\u{FE0E}', SAY_PUBLIC);
};
