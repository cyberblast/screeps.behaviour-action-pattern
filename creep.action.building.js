var action = new MODULES.creep.ability();

action.name = 'building';
action.isValidAction = function(creep){
    return ( creep.carry.energy > 0 && creep.room.constructionSites.count > 0 );
};
action.isValidTarget = function(target){
    return (target != null && target.progress != null && target.room.constructionSites.includes(target.id));
};  
action.newTarget = function(creep){
    var self = this;
    return creep.room.constructionSites.order.find(function(id){
        self.isAddableTarget(creep.room.constructionSites[id])
    });
};
action.work = function(creep){
    return creep.build(creep.target);
};

module.exports = action;