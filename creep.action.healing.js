let action = new Creep.Action('healing');
module.exports = action;
action.targetRange = 3;
action.isAddableAction = function(){ return true; };
action.isAddableTarget = function(){ return true; };
action.isValidTarget = function(target, creep){
    return ( target != null &&
        target.hits != null &&
        target.hits < target.hitsMax &&
        target.my &&
        target.pos.roomName === creep.data.healRoom);
};
action.newTarget = function(creep){
    if(creep.room.casualties.length > 0){
        for (const target of creep.room.casualties) {
            if (target.name !== creep.name) {
                creep.data.healRoom = target.pos.roomName;
                return target;
            }
        }
    }
    delete creep.data.healRoom;
    return null;
};
action.work = function(creep){
    if( creep.target.hits < creep.target.hitsMax ){
        if( creep.pos.isNearTo(creep.target) ){
            return creep.heal(creep.target);
        }
        if(creep.pos.inRangeTo(creep.target, 3)) {
            return creep.rangedHeal(creep.target);
        }
        return OK;
    }
};