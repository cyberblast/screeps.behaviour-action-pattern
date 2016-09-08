var action = new Creep.Action('repairing');
action.targetRange = 3;
action.isValidAction = function(creep){
    return (creep.carry.energy > 0 );
};
action.isValidTarget = function(target){
    return ( target != null && target.hits && 
    target.hits < target.hitsMax);
};   
action.newTarget = function(creep){
    var that = this;
    var isAddable = target => that.isAddableTarget(target);
    return _.find(creep.room.urgentRepairableSites, isAddable);
};
action.work = function(creep){
    return creep.repair(creep.target);
};
module.exports = action;
