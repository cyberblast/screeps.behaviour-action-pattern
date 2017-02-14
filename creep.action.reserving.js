let action = new Creep.Action('reserving');
module.exports = action;
action.isValidAction = function(creep){ return true; };
action.isValidTarget = function(target){  return target && (!target.reservation || target.reservation.ticksToEnd < 4999 ) };
action.isAddableAction = function(){ return true; };
action.isAddableTarget = function(){ return target &&
    ( target instanceof Flag || ( target.structureType === 'controller' && !target.owner ) );
};
action.newTarget = function(creep){
    let validColor = flagEntry => (
        (flagEntry.color == FLAG_COLOR.claim.reserve.color && flagEntry.secondaryColor == FLAG_COLOR.claim.reserve.secondaryColor) ||
        (flagEntry.color == FLAG_COLOR.invade.exploit.color && flagEntry.secondaryColor == FLAG_COLOR.invade.exploit.secondaryColor)
    );

    let flag;
    // TODO: remove  || creep.data.destiny.flagName (temporary backward compatibility)
    if( creep.data.destiny ) flag = Game.flags[creep.data.destiny.targetName || creep.data.destiny.flagName];
    if ( !flag ) flag = FlagDir.find(validColor, creep.pos, false, FlagDir.reserveMod, creep.name);

    if( flag ) {
        Population.registerCreepFlag(creep, flag);
    }
    else return null;

    // not there, go to flagged room
    if( !creep.flag.room || creep.flag.pos.roomName != creep.pos.roomName){
        return creep.flag;
    }

    return creep.flag.room.controller;
};

action.step = function(creep){
    if(CHATTY) creep.say(this.name, SAY_PUBLIC);
    if( creep.target.color ){
        if( creep.flag.pos.roomName == creep.pos.roomName )
            creep.data.targetId = null;
        creep.drive( creep.target.pos, 0, 1, Infinity );
        return;
    }

    let range = creep.pos.getRangeTo(creep.target);
    if( range <= this.targetRange ) {
        var workResult = this.work(creep);
        if( workResult != OK ) {
            creep.handleError({errorCode: workResult, action: this, target: creep.target, range, creep});
        }
    }
    creep.drive( creep.target.pos, this.reachedRange, this.targetRange, range );
};
action.work = function(creep){
    var workResult;

    creep.controllerSign();

    if( creep.target.owner && !creep.target.my ){
        workResult = creep.attackController(creep.target);
    }
    else {
        workResult = creep.reserveController(creep.target);
    }
    return workResult;
};
action.onAssignment = function(creep, target) {
    if( SAY_ASSIGNMENT ) creep.say(String.fromCharCode(9971), SAY_PUBLIC);
};
