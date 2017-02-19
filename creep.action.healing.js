let action = new Creep.Action('healing');
module.exports = action;
action.isAddableAction = function(){ return true; };
action.isAddableTarget = function(){ return true; };
action.isValidTarget = function(target){
    return ( target != null &&
        target.hits != null &&
        target.hits < target.hitsMax &&
        target.my );
};
action.newTarget = function(creep){
    if(creep.room.casualties.length > 0){
        return creep.room.casualties[0];
    }
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
action.onAssignment = function(creep, target) {
    if( SAY_ASSIGNMENT ) creep.say(String.fromCharCode(9960), SAY_PUBLIC);
};
