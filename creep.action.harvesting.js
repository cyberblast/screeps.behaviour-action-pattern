var action = new MODULES.creep.Action();

action.name = 'harvesting';

action.isValidAction = function(creep){
    return ( creep.carry.energy < creep.carryCapacity && 
    creep.room.sourceEnergyAvailable > 0 && 
    (creep.memory.action == 'harvesting' || creep.carry.energy == 0));
};
action.isValidTarget = function(target){
    return (target != null && target.energy != null && target.energy > 0);
};   
action.isAddableAction = function(){ return true; };
action.isAddableTarget = function(target){ 
    return (!target.creeps || !target.creeps[maxPerTargetType] || target.creeps[maxPerTargetType].length < target.accessibleFields*1.5);
};

action.newTarget = function(creep){
    var target = null;
    var sourceGuests = 999;
    for( var iSource = 0; iSource < creep.room.sources.length; iSource++ ){
        var source = creep.room.sources[iSource];
        if( this.isValidTarget(source) && this.isAddableTarget(source) && (source.creeps == null || source.creeps.length < sourceGuests )){
            sourceGuests = source.creeps == null ? 0 : source.creeps.length;
            target = source;
        }
    }
    return target;
};
action.work = function(creep){
    return creep.harvest(creep.target);
};

module.exports = action;