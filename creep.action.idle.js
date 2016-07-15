var action = new MODULES.creep.ability();

action.name = 'idle';

action.isAddableAction = function(creep){
    return true;
};

action.isAddableTarget = function(target){ 
    return true;
}; 

action.newTarget = function(creep){
    var self = this;
    return creep.room.constructionSites.order.find(function(id){
        self.isAddableTarget(creep.room.constructionSites[id])
    });
};
action.step = function(creep) {
    if(CHATTY) creep.say(this.name);
    creep.memory.target = null;
    creep.memory.action = null;
    if(creep.target && creep.pos != creep.target.pos) {
        creep.moveTo(creep.target);
    } 
};

module.exports = action;