let action = new Creep.Action('repairing');
module.exports = action;
action.targetRange = 3;
action.maxPerTarget = 1;
action.isValidAction = function(creep){
    return (creep.carry.energy > 0 );
};
action.isValidTarget = function(target){
    return ( target != null && target.hits &&
    target.hits < target.hitsMax);
};
action.isAddableTarget = function(target, creep){
    return (
        (target instanceof OwnedStructure && target.my) ||
        (
            (!creep.room.controller ||
                (
                    (!creep.room.controller.owner || creep.room.controller.my) &&
                    (!creep.room.controller.reservation || creep.room.controller.reservation.username == creep.owner.username)
                )
            )
        )
    ) && (!target.targetOf || target.targetOf.length < this.maxPerTarget);
};
action.newTarget = function(creep){
    var that = this;
    var isAddable = target => that.isAddableTarget(target, creep);
    return _.find(creep.room.structures.urgentRepairable, isAddable);
};
action.work = function(creep){
    return creep.repair(creep.target);
};
