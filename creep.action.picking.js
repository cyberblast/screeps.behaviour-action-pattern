var action = _.cloneDeep(require('creep.action'));

action.name = 'picking';

action.isValidAction = function(creep){
    return ( _.sum(creep.carry) < creep.carryCapacity );
};
action.isValidTarget = function(target){
    return (target != null && target.amount != null && target.amount > 0);
};   
action.newTarget = function(creep){
    return creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
        filter: (o) => this.isAddableTarget(o)
    });
};
action.work = function(creep){
    return creep.pickup(creep.target);
};

module.exports = action;