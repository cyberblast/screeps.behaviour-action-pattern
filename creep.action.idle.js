let action = new Creep.Action('idle');
module.exports = action;
action.targetRange = 3;
action.isValidAction = function(creep){ return true; };
action.isAddableAction = function(creep){ return true; };
action.isAddableTarget = function(target){ return true; };
action.newTarget = function(creep){
    return FlagDir.specialFlag();
};
action.step = function(creep){
    if(global.CHATTY) creep.say(this.name, global.SAY_PUBLIC);
    creep.idleMove();
    delete creep.data.actionName;
    delete creep.data.targetId;
};