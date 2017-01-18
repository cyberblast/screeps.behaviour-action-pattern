let action = new Creep.Action('idle');
module.exports = action;
action.targetRange = 3;
action.isValidAction = function(creep){ return true; };
action.isAddableAction = function(creep){ return true; };
action.isAddableTarget = function(target){ return true; };
action.newTarget = function(creep){
    return creep;
};
action.step = function(creep){
    if(CHATTY) creep.say(this.name, SAY_PUBLIC);
    creep.idleMove();
    delete creep.data.actionName;
    delete creep.data.targetId;
};
action.onAssignment = function(creep, target) {
    if( SAY_ASSIGNMENT ) creep.say(String.fromCharCode(9835), SAY_PUBLIC);
};
