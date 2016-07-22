var action = new MODULES.creep.Action();

action.name = 'idle';
action.reusePath = 10;
action.ignoreCreeps = true;

action.isAddableAction = function(creep){
    return true;
};

action.isAddableTarget = function(target){ 
    return true;
}; 

action.newTarget = function(creep){
    return this.defaultTarget(creep);
};

action.step = function(creep) {
    if(CHATTY) creep.say(this.name, SAY_PUBLIC);
    creep.memory.target = null;
    creep.memory.action = null;
    if(creep.target && creep.pos != creep.target.pos) {
        creep.moveTo(creep.target, {reusePath: this.reusePath});
    } 
};

module.exports = action;