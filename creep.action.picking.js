var action = new Creep.Action('picking');
action.maxPerAction = 2;
action.isValidAction = function(creep){
    return ( _.sum(creep.carry) < creep.carryCapacity );
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
    var result = creep.pickup(creep.target);
    if( result == OK ){
        // unregister
        creep.data.actionName = null;
        creep.data.targetId = null;
    }
    return result;
};
module.exports = action;