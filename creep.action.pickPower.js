let action = new Creep.Action('pickPower');
module.exports = action;
action.maxPerAction = 100;
action.maxPerTarget = 5;
action.isValidAction = function(creep){
    return ( creep.sum < creep.carryCapacity );
};
action.isValidTarget = function(target){
    return (target != null && target.amount != null && target.amount > 0);
};
action.isAddableAction = function(creep){
    if( creep.data.creepType.indexOf('remote') > 0 ) return true;
    else return (this.maxPerAction === Infinity || !creep.room.population || !creep.room.population.actionCount[this.name] || creep.room.population.actionCount[this.name] < this.maxPerAction);
};
action.isAddableTarget = function(target, creep){
    let max;
    if( creep.data.creepType.indexOf('remote') > 0 ) max = Infinity;
    else max =  this.maxPerTarget;
    let pickers = target.targetOf ? _.filter(target.targetOf, {actionName: 'pickPower'}) : [];
    return (!target.targetOf || !pickers.length || ((pickers.length < max) && target.amount > _.sum( pickers.map( t => t.carryCapacityLeft))));
};
action.newTarget = function(creep){
    let target;
    if( creep.room.situation.invasion ) {
        // pickup near sources only
        target = creep.pos.findClosestByPath(creep.room.droppedResources, {
            filter: (o) => this.isAddableTarget(o, creep) && o.pos.findInRange(creep.room.sources, 1).length > 0
        });
    } else {
        if ( creep.room.storage && creep.room.storage.my ) {
            target = creep.pos.findClosestByPath(creep.room.droppedResources, {
                filter: (o) => ( o.resourceType != RESOURCE_POWER && this.isAddableTarget(o, creep))
                });

        } else {
            target = creep.pos.findClosestByPath(creep.room.droppedResources, {
                filter: (o) => ( o.resourceType == RESOURCE_POWER && this.isAddableTarget(o, creep))
            });
        }
    }
    return target;
};
action.work = function(creep){
    var result = creep.pickup(creep.target);
    if( result == OK ){
        if( creep.sum < creep.carryCapacity*0.8 ) {
            // is there another in range?
            let loot = creep.pos.findInRange(creep.room.droppedResources, 1, {
                filter: (o) => o.resourceType != RESOURCE_POWER && this.isAddableTarget(o, creep)
            });
            if( !loot || loot.length < 1 ) loot = creep.pos.findInRange(creep.room.droppedResources, 1, {
                filter: (o) => this.isAddableTarget(o, creep)
            });
            if( loot && loot.length > 0 ) {
                this.assign(creep, loot[0]);
                return result;
            }
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
