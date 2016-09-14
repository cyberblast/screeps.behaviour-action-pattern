var action = new Creep.Action('travelling');
action.isValidTarget = function(target){ return target != null; }; 
action.isAddableAction = function(){ return true; };
action.isAddableTarget = function(){ return true; };
action.newTarget = function(creep){ return null; }
action.step = function(creep){
    if(CHATTY) creep.say(this.name, SAY_PUBLIC);
    if( creep.target ){
        this.drive(creep, creep.target.pos, Infinity, this.reachedRange, this.targetRange);
    }
    if( creep.target.pos.roomName == creep.pos.roomName ){
        // unregister
        creep.data.actionName = null;
        creep.data.targetId = null;
    }
}
module.exports = action;