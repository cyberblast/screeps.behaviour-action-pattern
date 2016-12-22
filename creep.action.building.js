var action = new Creep.Action('building');
action.maxPerTarget = 3;
action.targetRange = 3;
action.maxPerAction = 3;
action.isValidAction = function(creep){
    return ( creep.carry.energy > 0 && creep.room.constructionSites.length > 0 );
};
action.isAddableAction = function(creep){
    return true; //(!creep.room.population.actionCount[this.name] || creep.room.population.actionCount[this.name] < 3);
};
action.isValidTarget = function(target){
    return (target != null && target.progress && target.progress < target.progressTotal);
};  
action.isAddableTarget = function(target) {
    //  our site?
    return target.my && (!target.targetOf || target.targetOf.length < this.maxPerTarget);
};
action.newTarget = function(creep){
    var that = this;
    var isAddable = target => that.isAddableTarget(target, creep);
    return _.find(creep.room.getBestConstrucionSiteFor(creep), isAddable);
};
action.work = function(creep){
    return creep.build(creep.target);
};
action.onAssignment = function(creep, target) {
    if( SAY_ASSIGNMENT ) creep.say(String.fromCharCode(9874), SAY_PUBLIC); 
};
module.exports = action;
