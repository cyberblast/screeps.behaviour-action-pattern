var action = new Creep.Action('claiming');
action.reusePath = 10;
action.isValidTarget = function(target){ return true; }; 
action.isAddableAction = function(){ return true; };
action.isAddableTarget = function(){ return true; }; 
action.newTarget = function(creep){
    // get claim flag
    if( !creep.flag ){
        return null;
    }
    // not there, go to flagged room
    if( !creep.flag.room || creep.flag.room.name != creep.room.name){
        return creep.flag;    
    }
    if( creep.flag.room.controller.my ) {
        // already claimed, change flag
        // TODO: only if no spawn or spawn-constructionSite present
        creep.flag.setColor(FLAG_COLOR.claim.spawn.color, FLAG_COLOR.claim.spawn.secondaryColor);
        // no valid target for claimer
        return null;
    }
    else {
        // set controller as target
        return creep.flag.room.controller;
    }
};

action.step = function(creep){
    if(CHATTY) creep.say(this.name);    
    if( creep.target.color ){
        creep.moveTo(creep.target);
        return;
    }    
    var moveResult = creep.moveTo(creep.target, {reusePath: this.reusePath});
    var workResult;
    if( creep.target.owner && !creep.target.my ){
        workResult = creep.attackController(creep.target);
    }
    else {
        workResult = creep.claimController(creep.target);
        if( workResult != OK ){
            workResult = creep.reserveController(creep.target);
        }
    }
};
module.exports = action;