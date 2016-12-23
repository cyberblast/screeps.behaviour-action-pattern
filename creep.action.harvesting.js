var action = new Creep.Action('harvesting');
action.renewTarget = false;
action.isValidAction = function(creep){
    return ( creep.sum < creep.carryCapacity && creep.room.sourceEnergyAvailable > 0 );
};
action.isValidTarget = function(target){
    return (target != null && target.energy != null && target.energy > 0 &&
        (target.targetOf === undefined || !_.some(target.targetOf, {'creepType': 'miner'}) ));
};
action.isAddableTarget = function(target, creep){
    return (
        (!creep.room.controller ||
            (
                (!creep.room.controller.owner || creep.room.controller.my) && // my room or not owned
                (!creep.room.controller.reservation || creep.room.controller.reservation.username == creep.owner.username) // my reservation or none
            )
        )
    ) && ( target.targetOf === undefined || target.targetOf.length < target.accessibleFields + 1 );
};
action.newTarget = function(creep){
    let target = null;
    let sourceGuests = 999;
    for( var iSource = 0; iSource < creep.room.sources.length; iSource++ ){
        let source = creep.room.sources[iSource];
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
module.exports = action;
