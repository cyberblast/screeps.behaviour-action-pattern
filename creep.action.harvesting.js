var action = new Creep.Action('harvesting');
action.isAddableAction = function(){ return true; };
action.isAddableTarget = function(target){ 
    return (target.targetOf === undefined || target.targetOf.length < (target.accessibleFields*1.5));
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
                let count = _.countBy(source.targetOf, 'creepType')[creep.data.creepType];
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
    if( creep.data.creepType == "miner" && sourceGuests == 0 ){ // branding
        let hasThisTarget = data => data.determinatedTarget == target.id;
        let existingBranding = _.find(Memory.population, hasThisTarget);
        if( !existingBranding ) creep.data.determinatedTarget = target.id;
    }
    return target;
};
action.work = function(creep){
    return creep.harvest(creep.target);
};
module.exports = action;