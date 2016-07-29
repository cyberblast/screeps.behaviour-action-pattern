var action = new Creep.Action('building');

action.ignoreCreeps = true;

action.isValidAction = function(creep){
    return ( creep.carry.energy > 0 && creep.room.constructionSites.count > 0 );
};
action.isValidTarget = function(target){
    return (target != null && target.progress != null && target.room.constructionSites.order.includes(target.id));
};  
action.newTarget = function(creep){
    var self = this;
    var id = creep.room.constructionSites.order.find(function(id){
        return self.isAddableTarget(creep.room.constructionSites[id])
    });
    if( id ) return creep.room.constructionSites[id];
    else return null;
};
action.work = function(creep){
    return creep.build(creep.target);
};

module.exports = action;