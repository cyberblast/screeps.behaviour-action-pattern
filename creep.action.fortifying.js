let action = new Creep.Action('fortifying');
module.exports = action;
action.maxPerTarget = 1;
action.maxPerAction = 1;
action.targetRange = 3;
action.isValidAction = function(creep){
    return (creep.carry.energy > 0 && ( (!creep.room.storage || !creep.room.storage.isActive()) || creep.room.storage.charge > 0.6 ));
};
action.isValidTarget = function(target){
    return ( target && target.isActive() && target.hits && target.hits < target.hitsMax);
};
action.newTarget = function(creep){
    var that = this;
    var isAddable = target => that.isAddableTarget(target, creep);
    return _.find(creep.room.structures.fortifyable, isAddable);
};
action.work = function(creep){
    return creep.repair(creep.target);
};
