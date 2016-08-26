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
    // TODO: Better targetting algorithm. Actually simply the last source will be selected (with same crowd). 
    //       Compare sources regarding remaining energy & crowd/accessibleFields 
    var target = null;
    var sourceGuests = 999;
    for( var iSource = 0; iSource < creep.room.sources.length; iSource++ ){
        var source = creep.room.sources[iSource];
        if( this.isValidTarget(source) && this.isAddableTarget(source) && (source.targetOf === undefined || source.targetOf.length < sourceGuests )){
            sourceGuests = (source.targetOf === undefined) ? 0 : source.targetOf.length;
            target = source;
        }
    }
    return target;
};
action.work = function(creep){
    return creep.harvest(creep.target);
};
module.exports = action;