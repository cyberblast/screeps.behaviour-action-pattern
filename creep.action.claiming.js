var action = new MODULES.creep.Action();

action.name = 'claiming';
action.reusePath = 10;

action.isValidTarget = function(target){ return true; }; 
action.isAddableAction = function(){ return true; };
action.isAddableTarget = function(){ return true; }; 

action.newTarget = function(creep){
    var flag = _.find(Game.flags, {'color': FLAG_COLOR.claim });    // TODO: Limit to 1 creep per flag or even distribution
    if( !flag ){
        return null;
    }

    if( !flag.room || flag.room.name != creep.room.name)
        return flag;
    
    if( flag.room.controller.my ) {
        flag.setColor(FLAG_COLOR.settle);
        return null;
    }
    else {
        return flag.room.controller;
    }
}

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
    }
    if( workResult == ERR_GCL_NOT_ENOUGH ){
        workResult = creep.reserveController(creep.target);
    }
}

module.exports = action;