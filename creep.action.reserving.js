let action = new Creep.Action('reserving');
module.exports = action;
action.isValidAction = function(creep){ return true; };
action.isValidTarget = function(target){  return target && (!target.reservation || target.reservation.ticksToEnd < 4999 ) };
action.isAddableAction = function(){ return true; };
action.isAddableTarget = function(target, creep){ return target &&
    ( target instanceof Flag || ( target.structureType === 'controller' && !target.owner ) );
};
action.newTarget = function(creep){
    let validColor = flagEntry => (
        Flag.compare(flagEntry, FLAG_COLOR.claim.reserve) || Flag.compare(flagEntry, FLAG_COLOR.invade.exploit)
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
        if( creep.flag.pos.roomName == creep.pos.roomName ) // change target from flag to controller
            creep.data.targetId = null;
        return creep.travelTo( creep.target.pos );
    }

    let range = creep.pos.getRangeTo(creep.target);
    if( range <= this.targetRange ) {
        var workResult = this.work(creep);
        if( workResult != OK ) {
            creep.handleError({errorCode: workResult, action: this, target: creep.target, range, creep});
        }
        return workResult;
    }
    return creep.travelTo( creep.target.pos );
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
