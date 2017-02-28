let action = new Creep.Action('harvesting');
module.exports = action;
action.renewTarget = false;
action.isValidAction = function(creep){
    return ( creep.sum < creep.carryCapacity && creep.room.sourceEnergyAvailable > 0 );
};
action.isValidTarget = function(target) {
    return (target !== null && target.energy !== null && target.energy > 0 &&
        (target.targetOf === undefined || 
            (target.targetOf.length <= target.accessibleFields &&
                !_.some(target.targetOf, c => (c.creepType === 'miner' || c.creepType === 'remoteMiner')
                    && c.body.work >= 5
                    && (c.ticksToLive || CREEP_LIFE_TIME) >= (c.data && c.data.predictedRenewal || 0)
                )
            )
        ));
};
action.isAddableTarget = function(target, creep){
    return (
        (!creep.room.controller ||
            (
                (!creep.room.controller.owner || creep.room.controller.my) && // my room or not owned
                (!creep.room.controller.reservation || creep.room.controller.reservation.username == creep.owner.username) // my reservation or none
            )
        )
    ) && ( target.targetOf === undefined || target.targetOf.length < target.accessibleFields );
};
action.newTarget = function(creep){
    let target = null;
    let sourceGuests = 999;
    var roomSources = _.sortBy(creep.room.sources, s => creep.pos.getRangeTo(s));
    for( var iSource = 0; iSource < roomSources.length; iSource++ ){
        let source = roomSources[iSource];
        if( this.isValidTarget(source) && this.isAddableTarget(source, creep) ){
            if( source.targetOf === undefined ) {
                sourceGuests = 0;
                target = source;
                break;
            } else {
                let guests = _.countBy(source.targetOf, 'creepType');
                let count = guests[creep.data.creepType];
                if( !count ) {
                    sourceGuests = 0;
                    target = source;
                } else if( count < sourceGuests ) {
                    sourceGuests = count;
                    target = source;
                }
            }
        }
    }
    return target;
};
action.work = function(creep){
    return creep.harvest(creep.target);
};
action.onAssignment = function(creep, target) {
    if( SAY_ASSIGNMENT ) creep.say(String.fromCharCode(9935), SAY_PUBLIC);
};
