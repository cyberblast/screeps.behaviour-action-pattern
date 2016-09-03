var action = new Creep.Action('idle');
action.isValidAction = function(creep){ return true; };
action.isAddableAction = function(creep){ return true; };
action.isAddableTarget = function(target){ return true; }; 
action.newTarget = function(creep){
    var flag = FlagDir.find(FLAG_COLOR.idle, creep.pos, true);
    if( flag ) return flag;
    if( creep.data.homeRoom && creep.pos.roomName != creep.data.homeRoom){
        // go to home room
        var exitDir = creep.room.findExitTo(creep.data.homeRoom);
        var exit = creep.pos.findClosestByRange(exitDir);
        return exit;
    }
    return creep.room.controller;
};
action.step = function(creep) {
    if(CHATTY) creep.say(this.name, SAY_PUBLIC);
    if(creep.target && creep.pos != creep.target.pos) {
        creep.moveTo(creep.target, {reusePath: 10});
    } 
    creep.data.actionName = null;
    creep.data.targetId = null;
};
module.exports = action;