var action = new Creep.Action('reserving');
action.isValidAction = function(creep){ return true; }; // TODO: check if it is a flag or a controller and reservation < 4999 
action.isValidTarget = function(target){ return true; }; 
action.isAddableAction = function(){ return true; };
action.isAddableTarget = function(){ return true; }; 
action.newTarget = function(creep){
    let flag = FlagDir.find(FLAG_COLOR.claim.reserve, creep.pos, false, FlagDir.reserveMod, creep.name);
    if( !flag ) flag = FlagDir.find(FLAG_COLOR.invade.exploit, creep.pos, false, FlagDir.reserveMod, creep.name);
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
            if( DEBUG ) logErrorCode(creep, workResult);
            delete creep.data.actionName;
            delete creep.data.targetId;
        }
    } 
    creep.drive( creep.target.pos, this.reachedRange, this.targetRange, range );
};
action.work = function(creep){
    var workResult;
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
module.exports = action;
