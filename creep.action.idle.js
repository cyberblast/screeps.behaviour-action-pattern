var action = new Creep.Action('idle');
action.targetRange = 3;
action.isValidAction = function(creep){ return true; };
action.isAddableAction = function(creep){ return true; };
action.isAddableTarget = function(target){ return true; }; 
action.newTarget = function(creep){
    if( creep.data.homeRoom && creep.pos.roomName != creep.data.homeRoom){
        // go to home room
        var exitDir = creep.room.findExitTo(creep.data.homeRoom);
        var exit = creep.pos.findClosestByRange(exitDir);
        return exit;
    }
    if( creep.room.storage ) return creep.room.storage;
    return creep.room.controller;    
    //if( creep.data.idleSpot ) 
    //    return new RoomPosition(creep.data.idleSpot.x, creep.data.idleSpot.y, creep.data.idleSpot.roomName );
    //else {
    // TODO: find nearest pos of "void" location (no road, no structure)
    //}
};
action.work = function(creep){
    creep.data.actionName = null;
    creep.data.targetId = null;
    return OK;
};
action.onAssignment = function(creep, target) {
    if( SAY_ASSIGNMENT ) creep.say(String.fromCharCode(9835), SAY_PUBLIC); 
};
module.exports = action;