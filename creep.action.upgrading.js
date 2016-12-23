var action = new Creep.Action('upgrading');
action.targetRange = 3;
action.isAddableAction = function(creep){
    return !creep.room.storage;
};
action.isAddableTarget = function(target){ return true; };
action.isValidAction = function(creep){
    return creep.carry.energy > 0;
};
action.isValidTarget = function(target){
    return (target != null ) && target.structureType == 'controller' && target.my;
};
action.newTarget = function(creep){
    return ( creep.room.controller && creep.room.controller.my) ? creep.room.controller : null;
};
action.work = function(creep){
    return creep.upgradeController(creep.room.controller);
};
action.step = function(creep){
    if(CHATTY) creep.say(this.name, SAY_PUBLIC);
    let range = creep.pos.getRangeTo(creep.target);
    if( range <= this.targetRange ) {
        var workResult = this.work(creep);
        if( workResult != OK ) {
            if( DEBUG ) logErrorCode(creep, workResult);
            delete creep.data.actionName;
            delete creep.data.targetId;
        }
    }
    creep.drive( creep.target.pos, this.reachedRange, this.targetRange, range );
};
action.onAssignment = function(creep, target) {
    if( SAY_ASSIGNMENT ) creep.say(String.fromCharCode(9962), SAY_PUBLIC);
};

module.exports = action;
