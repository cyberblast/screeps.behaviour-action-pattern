var action = new Creep.Action('building');

action.ignoreCreeps = false;

action.isValidAction = function(creep){
    return ( creep.carry.energy > 0 && creep.room.constructionSites.length > 0 );
};
action.isValidTarget = function(target){
    return (target != null && target.progress != null && target.progress < target.progressTotal);
};  
action.isAddableAction = function(creep){
    return (!creep.room.activities[this.name] || creep.room.activities[this.name] < creep.room.maxPerJob*2);
};
action.newTarget = function(creep){
    var self = this;
    var isAddable = target => self.isAddableTarget(target);
    return _.find(creep.room.constructionSites, isAddable);
};
action.work = function(creep){
    return creep.build(creep.target);
};

module.exports = action;