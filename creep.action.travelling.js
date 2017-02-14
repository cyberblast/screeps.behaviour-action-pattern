let action = new Creep.Action('travelling');
module.exports = action;
action.isValidTarget = function(target){ return target != null; };
action.isAddableAction = function(){ return true; };
action.isAddableTarget = function(){ return true; };
action.newTarget = function(creep){ return null; }
action.step = function(creep){
    if(CHATTY) creep.say(this.name, SAY_PUBLIC);
    if( creep.target ){
        let pos;
        if( creep.target.id == creep.id ) pos = new RoomPosition(25, 25, creep.data.travelRoom);
        else pos = creep.target.pos;
        creep.drive( pos, this.reachedRange, this.targetRange, Infinity );
    }
    if( !creep.target || creep.target.pos.roomName == creep.pos.roomName ){
        // unregister
        delete creep.action;
        delete creep.target;
        delete creep.data.actionName;
        delete creep.data.targetId;
        delete creep.data.travelRoom;
    }
}
action.onAssignment = function(creep, target) {
    if( SAY_ASSIGNMENT ) creep.say(String.fromCharCode(9784), SAY_PUBLIC);
};
