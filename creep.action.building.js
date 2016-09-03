var action = new Creep.Action('building');
action.maxPerTarget = 3;
action.targetRange = 3;
action.isValidAction = function(creep){
    return ( creep.carry.energy > 0 && creep.room.constructionSites.length > 0 );
};
action.isValidTarget = function(target){
    return (target != null && target.progress != null && target.progress < target.progressTotal);
};  
action.isAddableAction = function(creep){
    return true; //(!creep.room.population.actionCount[this.name] || creep.room.population.actionCount[this.name] < 3);
};
action.newTarget = function(creep){
    var that = this;
    var isAddable = target => that.isAddableTarget(target);
    return _.find(creep.room.constructionSites, isAddable);
};
action.work = function(creep){
    return creep.build(creep.target);
};
module.exports = action;