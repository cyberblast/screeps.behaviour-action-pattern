var action = new MODULES.creep.Action();

action.name = 'picking';

action.isValidAction = function(creep){
    return ( _.sum(creep.carry) < creep.carryCapacity );
};
action.isAddableAction = function(creep){
    return (!creep.room.activities[this.name] || creep.room.activities[this.name] < creep.room.maxPerJob+1);
};
action.isValidTarget = function(target){
    return (target != null && target.amount != null && target.amount > 0);
};   
action.newTarget = function(creep){
    var target = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
        filter: (o) => ( o.resourceType != RESOURCE_ENERGY && this.isAddableTarget(o))
    });
    
    if( target == null ) target = creep.pos.findClosestByPath(FIND_DROPPED_ENERGY, {
        filter: (o) => this.isAddableTarget(o)
    });
    
    return target;
};
action.work = function(creep){
    return creep.pickup(creep.target);
};

module.exports = action;