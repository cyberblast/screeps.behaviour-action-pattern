var action = new Creep.Action('picking');
action.maxPerAction = 4;
action.maxPerTarget = 2;
action.isValidAction = function(creep){
    return ( creep.sum < creep.carryCapacity );
};
action.isValidTarget = function(target){
    return (target != null && target.amount != null && target.amount > 0);
};
action.isAddableTarget = function(target){
    return (!target.targetOf || (
        target.targetOf.length < this.maxPerTarget) &&
        target.amount > _.sum( target.targetOf.map( t => ( t.actionName == 'picking' ? t.carryCapacityLeft : 0 ))));
};
action.newTarget = function(creep){
    let target;
    if( creep.room.situation.invasion ) {
        // pickup near sources only
        target = creep.pos.findClosestByPath(creep.room.droppedResources, {
            filter: (o) => this.isAddableTarget(o, creep) && o.pos.findInRange(creep.room.sources, 1).length > 0
        });
    } else {
        target = creep.pos.findClosestByPath(creep.room.droppedResources, {
            filter: (o) => ( o.resourceType != RESOURCE_ENERGY && this.isAddableTarget(o, creep))
        });

        if( !target ) target = creep.pos.findClosestByPath(creep.room.droppedResources, {
            filter: (o) => this.isAddableTarget(o, creep)
        });
    }
    return target;
};
action.work = function(creep){
    var result = creep.pickup(creep.target);
    if( result == OK ){
        // is there another in range?
        let loot = creep.pos.findInRange(creep.room.droppedResources, 1, {
            filter: (o) => o.resourceType != RESOURCE_ENERGY && this.isAddableTarget(o, creep)
        });
        if( !loot || loot.length < 1 ) loot = creep.pos.findInRange(creep.room.droppedResources, 1, {
            filter: (o) => this.isAddableTarget(o, creep)
        });
        if( loot && loot.length > 0 ) {
            this.assign(creep, loot[0]);
            return result;
        }
        // unregister
        delete creep.data.actionName;
        delete creep.data.targetId;
    }
    return result;
};
action.onAssignment = function(creep, target) {
    if( SAY_ASSIGNMENT ) creep.say(String.fromCharCode(8681), SAY_PUBLIC);
};
module.exports = action;