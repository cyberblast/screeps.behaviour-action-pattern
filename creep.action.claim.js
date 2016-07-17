var action = new MODULES.creep.Action();

action.name = 'claim';

action.isValidTarget = function(target){ return true; }; 
action.isAddableAction = function(){ return true; };
action.isAddableTarget = function(){ return true; };

action.newTarget = function(creep){
    // if not in targetroom, target is flag
    var flag = _.find(Game.flags, {'color': FLAG_COLOR.claim });    
    if( !flag ){
        return Game.flags['IdlePole'];
    }
    if( !flag.room || flag.room.name != creep.room.name)
        return flag;
    
    if( !flag.room.controller.my ) {
        return flag.room.controller;
    }
    
    return flag;
}

action.step = function(creep){
    if(CHATTY) creep.say(this.name);
    var target = creep.action.newTarget(creep);
    if( target ){
        if( creep.target && creep.target != target && creep.target.creeps && creep.target.creeps.includes(creep.name) )
            creep.target.creeps.splice(creep.target.creeps.indexOf(creep.name), 1);
        creep.target = target;        
        if( !creep.target.creeps ) 
            creep.target.creeps = [];
        if( !(creep.name in creep.target.creeps) ) 
            creep.target.creeps.push(creep.name);
        creep.memory.target = creep.action.getTargetId(creep.target);
    }
    
    if( creep.target.color ){
        creep.say('Approaching');
        creep.moveTo(creep.target);
        return;
    }
    
    var moveResult = creep.moveTo(creep.target, {reusePath: 15});
    var workResult;
    if( creep.target.owner && !creep.target.my ){
        workResult = creep.attackController(creep.target);
        creep.say('Attacking');
    }
    else {
        workResult = creep.claimController(creep.target);
        creep.say('Claiming');
    }
    if( workResult == ERR_GCL_NOT_ENOUGH ){
        workResult = creep.reserveController(creep.target);
        creep.say('Reserving');
    }
}

module.exports = action;
/*
module.exports = {

        var claimFlag = Game.flags['Claim'];
        // if no claim flag => Idle
        if( !claimFlag ){
            MODULES.creep.assignActionWithTarget(creep, MODULES.creep.action.idle);
        }
        else {
            // Move to room with Flag "Claim"
            if( !claimFlag.room || creep.room.name != claimFlag.room.name ){
                creep.say('Approaching');
                creep.moveTo(claimFlag, {reusePath: 15});
                creep.target = claimFlag;
                creep.memory.target = claimFlag.name;
                creep.action = null;
                creep.memory.action = 'settling';
                return;
            } 

            // Inside Claim Room
            
            // try claim or reserve
            creep.say('Claiming');
            var controller = creep.room.controller;
            creep.target = controller;
            creep.memory.target = controller.id;
            creep.action = null;
            creep.memory.action = 'claiming';
            var moveResult = creep.moveTo(controller, {reusePath: 15});
            var workResult;
            if( controller.owner && !controller.my )
                workResult = creep.attackController(controller);
            else workResult = creep.claimController(controller);
            if( workResult == ERR_GCL_NOT_ENOUGH ){
                workResult = creep.reserveController(controller);
            }
            
            creep.say(workResult);
            return;
        }       

        creep.target = creep.action.newTarget(creep);        
        if( creep.target ){
            if( !creep.target.creeps ) 
                creep.target.creeps = [];
            if( !(creep.name in creep.target.creeps) ) 
                creep.target.creeps.push(creep.name);
            creep.memory.target = creep.action.getTargetId(creep.target);
            creep.action.step(creep);
        }
};*/