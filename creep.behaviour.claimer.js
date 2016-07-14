var work = {
    actions: {
        idle: require('creep.action.idle')
    },
    setAction: function(creep, actionName) {
        if( creep.memory.action != actionName ){
            if( creep.memory.action )
                creep.room.activities[creep.memory.action]--;
            creep.memory.action = actionName;
            creep.memory.target = null;
        }
        creep.action = this.actions[actionName];
    },
    run: function(creep) {
        var claimFlag = Game.flags['Claim'];
        // if no claim flag => Idle
        if( !claimFlag ){
            creep.say('Set Claim');
            this.setAction(creep, 'idle');
        }
        else {
            // Move to room with Flag "Claim"
            if( !claimFlag.room || creep.room.name != claimFlag.room.name ){
                creep.say('Approaching');
                creep.moveTo(claimFlag);
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
            var moveResult = creep.moveTo(controller);
            var workResult = creep.claimController(controller);
            if( workResult == ERR_GCL_NOT_ENOUGH ){
                workResult = creep.reserveController(controller);
            }
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
    }
}


module.exports = work;