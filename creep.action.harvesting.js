var action = new Creep.Action('harvesting');
action.isAddableAction = function(){ return true; };
action.isAddableTarget = function(target){ 
    return (target.targetOf === undefined || target.targetOf.length < (target.accessibleFields));
};
action.isValidAction = function(creep){
    return ( _.sum(creep.carry) < creep.carryCapacity && 
    creep.room.sourceEnergyAvailable > 0 );
};
action.isValidTarget = function(target){
    return (target != null && target.energy != null && target.energy > 0);
};   
action.newTarget = function(creep){
    if( creep.data.determinatedTarget ) {
        let target = Game.getObjectById(creep.data.determinatedTarget);
        if( !target ) delete creep.data.determinatedTarget;
        else return target;
    }
    if( creep.data.creepType == "miner" ) {
        let notDeterminated = source => {
            let hasThisSource = data => {return data.determinatedTarget == source.id};
            let existingBranding = _.find(Memory.population, hasThisSource);
            return !existingBranding;
        };
        let target = _.find(creep.room.sources, notDeterminated);
        if( target ) {
            creep.data.determinatedTarget = target.id;
            return target;
        }
    }
    let target = null;
    let sourceGuests = 999;
    for( var iSource = 0; iSource < creep.room.sources.length; iSource++ ){
        let source = creep.room.sources[iSource];
        if( this.isValidTarget(source) && this.isAddableTarget(source) ){
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
    if( creep.data.creepType == "miner") {
        if( creep.carry.energy > creep.carryCapacity*0.5 ) {
            let cont = creep.pos.findInRange(creep.room.chargeables, 1, {
                filter: function(c){ 
                    return _.sum(c.store) < c.storeCapacity;
                }
            });
            if( cont.length > 0 ) creep.transfer(cont[0], RESOURCE_ENERGY);
        }
        let result = creep.harvest(creep.target);
        if (result == ERR_NOT_ENOUGH_RESOURCES) result = OK;
        return result;
    } 
    return creep.harvest(creep.target);
};
module.exports = action;
