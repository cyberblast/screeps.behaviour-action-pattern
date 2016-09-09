var action = new Creep.Action('idle');
action.targetRange = 0;
action.isValidAction = function(creep){ return true; };
action.isAddableAction = function(creep){ return true; };
action.isAddableTarget = function(target){ return true; }; 
action.newTarget = function(creep){
    /*var flag = FlagDir.find(FLAG_COLOR.idle, creep.pos, true);
    if( flag ) return flag;*/ // get rid of idle flag
    if( creep.data.homeRoom && creep.pos.roomName != creep.data.homeRoom){
        // go to home room
        var exitDir = creep.room.findExitTo(creep.data.homeRoom);
        var exit = creep.pos.findClosestByRange(exitDir);
        return exit;
    }
    if( creep.room.storage ) return creep.room.storage;
    return creep.room.controller;
};
action.work = function(creep){
    creep.data.actionName = null;
    creep.data.targetId = null;
};
module.exports = action;