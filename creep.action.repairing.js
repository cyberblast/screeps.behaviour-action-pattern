var action = _.cloneDeep(require('creep.action'));

action.name = 'repairing';

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
    return creep.room.creepRepairableSites.order.find(function(id){
        self.isAddableTarget(creep.room.creepRepairableSites[id])
    });
};
action.work = function(creep){
    return creep.repair(creep.target);
};

module.exports = action;