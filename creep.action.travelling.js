let action = new Creep.Action('travelling');
module.exports = action;
action.isValidTarget = function(target){ return target !== null; };
action.isAddableAction = function(){ return true; };
action.isAddableTarget = function(){ return true; };
action.newTarget = function(creep){ return null; };
action.step = function(creep){
    if(CHATTY) creep.say(this.name, SAY_PUBLIC);
    const targetRange = creep.data.travelRange || this.targetRange;
    let target = creep.target;
    if (target.id === creep.id) {
        if (creep.data.travelRoom) {
            target = new RoomPosition(25, 25, creep.data.travelRoom);
        } else if (creep.data.travelPos) {
            const p = creep.data.travelPos;
            target = new RoomPosition(p.x, p.y, p.roomName);
        }
    }
    if( target ){
        const range = creep.pos.getRangeTo(target);
        if( range <= targetRange ) {
            return Creep.action.travelling.unregister(creep);
        }
        creep.travelTo(target, {range:targetRange, ignoreCreeps:creep.data.ignoreCreeps || true});
    } else {
        action.unregister(creep);
    }
};
action.assignRoom = function(creep, roomName) {
    let travelFlag = Game.flags[roomName + '-travel'];
    if (!travelFlag) {
        const room = Game.rooms[roomName];
        if (room) travelFlag = room.createFlag(25, 25, roomName + '-travel');
    }
    
    if (_.isUndefined(creep.data.travelRange)) creep.data.travelRange = TRAVELLING_BORDER_RANGE;
    
    if (travelFlag) {
        return Creep.action.travelling.assign(creep, travelFlag);
    } else {
        creep.data.travelRoom = roomName;
        return Creep.action.travelling.assign(creep, creep);
    }
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
