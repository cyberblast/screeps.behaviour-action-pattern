let action = new Creep.Action('building');
module.exports = action;
action.maxPerTarget = 3;
action.targetRange = 3;
action.maxPerAction = 3;
action.isValidAction = function(creep){
    return ( creep.carry.energy > 0 );
};
action.isAddableAction = function(creep){
    return ( !creep.room.population || !creep.room.population.actionCount[this.name] || creep.room.population.actionCount[this.name] < this.maxPerAction);
};
action.isValidTarget = function(target){
    return (target != null && target.my && target.progress && target.progress < target.progressTotal);
};  
action.isAddableTarget = function(target) {
    //  our site?
    return target && target.my && (!target.targetOf || target.targetOf.length < this.maxPerTarget);
};
action.newTarget = function(creep){
    var that = this;
    var isAddable = target => that.isAddableTarget(target, creep);
    return creep.room.getBestConstructionSiteFor(creep.pos, isAddable);
};
action.work = function(creep){
    return creep.build(creep.target);
};
action.onAssignment = function(creep, target) {
    if( SAY_ASSIGNMENT ) creep.say(String.fromCharCode(9874), SAY_PUBLIC); 
};
