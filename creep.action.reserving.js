var action = new Creep.Action('reserving');
action.isValidAction = function(creep){ return true; }; // TODO: check if it is a flag or a controller and reservation < 4999 
action.isValidTarget = function(target){ return true; }; 
action.isAddableAction = function(){ return true; };
action.isAddableTarget = function(){ return true; }; 
action.newTarget = function(creep){
    let flag = FlagDir.find(FLAG_COLOR.claim.reserve, creep.pos, false, FlagDir.reserveMod, creep.name);
    if( flag ) { 
        Population.registerCreepFlag(creep, flag);
    } 
    else return null;

    // not there, go to flagged room
    if( !creep.flag.room || creep.flag.pos.roomName != creep.pos.roomName){
        return creep.flag;    
    }
    if( creep.flag.room.controller.my ) { // TODO: AND is reserve flag
        // already claimed, change flag
        // TODO: only if no spawn or spawn-constructionSite present
        creep.flag.setColor(FLAG_COLOR.claim.spawn.color, FLAG_COLOR.claim.spawn.secondaryColor);
        // TODO: remove exploit flags
        let remove = f => Game.flags[f.name].remove();
        _.forEach(FlagDir.filter(FLAG_COLOR.invade.exploit, creep.flag.pos, true), remove);
        // no valid target for claimer
        return null;
    }
    else {
        // set controller as target
        return creep.flag.room.controller;
    }
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
            creep.data.actionName = null;
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
