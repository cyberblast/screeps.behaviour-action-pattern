let action = new Creep.Action('claiming');
module.exports = action;
action.isValidAction = function(creep){ return true; };
action.isValidTarget = function(target){ return !target.room || !target.owner; }; // no sight or not owned
action.isAddableAction = function(){ return true; };
action.isAddableTarget = function(){ return true; };
action.newTarget = function(creep){
    let flag;
    // TODO: remove  || creep.data.destiny.flagName (temporary backward compatibility)
    if( creep.data.destiny ) flag = Game.flags[creep.data.destiny.targetName || creep.data.destiny.flagName];
    if ( !flag ) flag = FlagDir.find(FLAG_COLOR.claim, creep.pos, false, FlagDir.claimMod, creep.name); 

    if( flag ) {
        Population.registerCreepFlag(creep, flag);
    }
    else return null;

    // not there, go to flagged room
    if( !creep.flag.room || creep.flag.pos.roomName != creep.pos.roomName){
        return creep.flag;
    }
    if( creep.flag.room.controller.my ) { // TODO: AND is claim flag
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
    if(global.CHATTY) creep.say(this.name, global.SAY_PUBLIC);
    if( creep.target.color ){
        if( creep.flag.pos.roomName == creep.pos.roomName ) // change target from flag to controller
            creep.data.targetId = null;
        creep.travelTo(creep.target.pos);
        return;
    }

    let range = creep.pos.getRangeTo(creep.target);
    if( range <= this.targetRange ) {
        var workResult = this.work(creep);
        if( workResult != OK ) {
            creep.handleError({errorCode: workResult, action: this, target: creep.target, range, creep});
        }
    }
    creep.travelTo(creep.target.pos);
};
action.work = function(creep){
    creep.controllerSign();

    return creep.claimController(creep.target);
    /*
    var workResult;
        workResult = creep.claimController(creep.target);
    if( creep.target.owner && !creep.target.my ){
        workResult = creep.attackController(creep.target);
    }
    else {
        workResult = creep.claimController(creep.target);
        if( workResult != OK ){
            workResult = creep.reserveController(creep.target);
        }
    }
    return workResult;
    */
};
