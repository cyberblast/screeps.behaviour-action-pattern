var action = new Creep.Action('harvesting');
action.renewTarget = false;
action.isAddableAction = function(creep){ 
    return (!creep.room.population || 
        !creep.room.population.typeCount['hauler'] || 
        !creep.room.population.typeCount['miner'] || 
        creep.room.population.typeCount['hauler'] < 1 || 
        creep.room.population.typeCount['miner'] < 1); 
};
action.isAddableTarget = function(target, creep){ 
    return (
        (!creep.room.controller || 
            (
                (!creep.room.controller.owner || creep.room.controller.my) && 
                (!creep.room.controller.reservation || creep.room.controller.reservation.username == creep.owner.username) 
            )
        )
    ) && (target.targetOf === undefined || 
        target.targetOf.length < target.accessibleFields );
};
action.isValidAction = function(creep){
    return ( creep.sum < creep.carryCapacity && 
    creep.room.sourceEnergyAvailable > 0 );
};
action.isValidTarget = function(target){
    return (target != null && target.energy != null && target.energy > 0);
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
                // has dedicated miner? go away...
                if( !guests.miner ) { 
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
