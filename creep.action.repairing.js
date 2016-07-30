var action = new Creep.Action('repairing');

action.ignoreCreeps = false;

action.isValidAction = function(creep){
    return (creep.carry.energy > 0 && creep.room.creepRepairableSites.count > 0 );
};
action.isValidTarget = function(target){
    return ( target != null && target.hits != null && 
    target.hits < target.hitsMax && 
    (target.room.repairableSites.order.includes(target.id) || target.hits < LIMIT_CREEP_REPAIRING));
};   
action.newTarget = function(creep){
    var self = this;
    var id = creep.room.creepRepairableSites.order.find(function(id){
        return self.isAddableTarget(creep.room.creepRepairableSites[id])
    });
    if( id ) return creep.room.creepRepairableSites[id];
    else return null;
};
action.work = function(creep){
    return creep.repair(creep.target);
};

module.exports = action;