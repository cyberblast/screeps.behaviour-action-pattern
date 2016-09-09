var action = new Creep.Action('reserving');
action.reusePath = 10;
action.isValidAction = function(creep){ return true; }; 
action.isValidTarget = function(target){ return true; }; 
action.isAddableAction = function(){ return true; };
action.isAddableTarget = function(){ return true; }; 
action.newTarget = function(creep){
    let flag = FlagDir.find(FLAG_COLOR.claim.reserve, creep.pos, false, FlagDir.claimMod);
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
        this.drive(creep, creep.target.pos, Infinity);
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
    if( range > 1 )
        this.drive(creep, creep.target.pos, range);
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
module.exports = action;
