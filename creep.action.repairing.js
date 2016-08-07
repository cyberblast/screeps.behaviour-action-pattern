var action = new Creep.Action('repairing');

action.ignoreCreeps = false;

action.isValidAction = function(creep){
    return (creep.carry.energy > 0 && creep.room.urgentRepairableSites.length > 0 );
};
action.isValidTarget = function(target){
    return ( target != null && target.hits != null && 
    target.hits < target.hitsMax && 
    target.hits < LIMIT_CREEP_REPAIRING);
};   
action.newTarget = function(creep){
    var self = this;
    var isAddable = target => self.isAddableTarget(target);
    return _.find(creep.room.urgentRepairableSites, isAddable);
};
action.work = function(creep){
    return creep.repair(creep.target);
};

module.exports = action;