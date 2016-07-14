var action = _.cloneDeep(require('creep.action'));

action.name = 'building';
action.isValidAction = function(creep){
    return ( creep.carry.energy > 0 && creep.room.constructionSites.count > 0 );
};
action.isValidTarget = function(target){
    return (target != null && target.progress != null && target.id in target.room.constructionSites);
};    
action.isAddableAction = function(creep){
    return (!creep.room.activities[this.name] || creep.room.activities[this.name] < creep.room.maxPerJob);
};
action.isAddableTarget = function(target){ 
    return target.creeps.length < 3;
};
action.newTarget = function(creep){
    var room = creep.room;
    var site = null;
    room.constructionSites.order.every(id => {
        if( this.isAddableTarget(room.constructionSites[id]) ){
            site = room.constructionSites[id];
            return false;
        }
        return true;
    });
    return site;
};
action.work = function(creep){
    return creep.build(creep.target);
};

module.exports = action;