let action = new Creep.Action('upgrading');
module.exports = action;
action.targetRange = 3;
action.isAddableAction = function(creep){
    // no storage
    return !creep.room.storage 
    // storage has surplus
    || creep.room.storage.charge > 1
    // storage is leftover from invasion and has usable energy
    || (!creep.room.storage.my && creep.room.storage.store.energy > 0);
};
action.isAddableTarget = function(target, creep){ 
    // Limit to upgraders only at RCL8
    if( target.level === 8 && (!creep.data || creep.data.creepType != 'upgrader') ) return false;
    return true;
};
action.isValidAction = function(creep){
    return creep.carry.energy > 0;
};
action.isValidTarget = function(target){
    return (target != null ) && target.structureType == 'controller' && target.my;
};
action.newTarget = function(creep){
    return ( creep.room.controller && creep.room.controller.my) ? creep.room.controller : null;
};
action.work = function(creep, range){
    if( range && range < 2 ) creep.controllerSign();
    return creep.upgradeController(creep.room.controller);
};
action.step = function(creep){
    if(CHATTY) creep.say(this.name, SAY_PUBLIC);
    let range = creep.pos.getRangeTo(creep.target);
    if( range <= this.targetRange ) {
        let workResult = this.work(creep, range);
        if( workResult != OK ) {
            creep.handleError({errorCode: workResult, action: this, target: creep.target, range, creep});
        }
    }
    creep.drive( creep.target.pos, this.reachedRange, this.targetRange, range );
};
action.onAssignment = function(creep, target) {
    //if( SAY_ASSIGNMENT ) creep.say(String.fromCharCode(9962), SAY_PUBLIC);
    if( SAY_ASSIGNMENT ) creep.say('\u{26EA}\u{FE0E}', SAY_PUBLIC);
};
