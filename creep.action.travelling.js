let action = new Creep.Action('travelling');
module.exports = action;
action.isValidTarget = function(target){ return target !== null; };
action.isAddableAction = function(){ return true; };
action.isAddableTarget = function(){ return true; };
action.newTarget = function(creep){ return null; };
action.step = function(creep){
    if(CHATTY) creep.say(this.name, SAY_PUBLIC);
    let targetRange = creep.data.travelRange || this.targetRange;
    let target = creep.target;
    if (FlagDir.isSpecialFlag(creep.target)) {
        if (creep.data.travelRoom) {
            const room = Game.rooms[creep.data.travelRoom];
            if (room && (room.name === creep.pos.roomName)) { // TODO || room.getBorder(creep.pos.roomName))) {
                creep.leaveBorder(); // TODO unregister / return false? and immediately acquire new action & target
                target = null;
            } else {
                targetRange = creep.data.travelRange || TRAVELLING_BORDER_RANGE || 22;
                target = new RoomPosition(25, 25, creep.data.travelRoom);
            }
        } else {
            logError(creep.name + 'Creep.action.travelling called with specialFlag target and travelRoom undefined.');
            target = null;
        }
    }
    if( target ){
        const range = creep.pos.getRangeTo(target);
        if( range <= targetRange ) {
            return action.unregister(creep);
        }
        creep.travelTo(target, {range:targetRange, ignoreCreeps:creep.data.ignoreCreeps || true});
    } else {
        action.unregister(creep);
    }
};
action.assignRoom = function(creep, roomName) {
    if (!roomName) {
        logError(creep.name + 'Creep.action.travelling.assignRoom called with no room.');
        return;
    }
    if (_.isUndefined(creep.data.travelRange)) creep.data.travelRange = TRAVELLING_BORDER_RANGE || 22;
    creep.data.travelRoom = roomName;
    return Creep.action.travelling.assign(creep, FlagDir.specialFlag());
};
action.unregister = function(creep) {
    delete creep.action;
    delete creep.target;
    delete creep.data.actionName;
    delete creep.data.ignoreCreeps;
    delete creep.data.targetId;
    delete creep.data.travelRoom;
    delete creep.data.travelRange;
};
action.onAssignment = function(creep, target) {
    if( SAY_ASSIGNMENT ) creep.say(String.fromCharCode(9784), SAY_PUBLIC);
};
