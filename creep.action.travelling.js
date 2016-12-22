var action = new Creep.Action('travelling');
action.isValidTarget = function(target){ return target != null; };
action.isAddableAction = function(){ return true; };
action.isAddableTarget = function(){ return true; };
action.newTarget = function(creep){ return null; }
action.step = function(creep){
    if(CHATTY) creep.say(this.name, SAY_PUBLIC);
    if( creep.target ){
        creep.drive( creep.target.pos, this.reachedRange, this.targetRange, Infinity );
    }
    if( creep.target.pos.roomName == creep.pos.roomName ){
        // unregister
        delete creep.data.actionName;
        delete creep.data.targetId;
    }
}
action.onAssignment = function(creep, target) {
    if( SAY_ASSIGNMENT ) creep.say(String.fromCharCode(9784), SAY_PUBLIC);
};
module.exports = action;