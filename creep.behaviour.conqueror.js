var work = {
    setAction: function(creep, actionName) {
        if( creep.memory.action != actionName ){
            if( creep.memory.action )
                creep.room.activities[creep.memory.action]--;
            creep.memory.action = actionName;
            creep.memory.target = null;
        }
        creep.action = MODULES.creep.action[actionName];
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
            
            // If room contains hostile creeps -> attack
            var closestHostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if( closestHostile ){
                creep.say('Attack!');
                creep.target = closestHostile;
                creep.memory.target = closestHostile.id;
                creep.memory.action = 'attacking';
                var moveResult = creep.moveTo(closestHostile);
                // TODO: Break Wall / Rampart
                var workResult = creep.attack(closestHostile);
                return;
            }

            // If room contains spawn -> attack
            var target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (structure) => {
                    return structure.structureType == STRUCTURE_SPAWN;
                }
            });
            if( target ){
                creep.say('Destroy!');
                creep.target = target;
                creep.memory.target = target.id;
                creep.memory.action = 'destroying';
                var moveResult = creep.moveTo(target);
                // TODO: Break Wall / Rampart
                var workResult = creep.attack(target);
                return;
            }

            // if !Controller.owner try claim or reserve
            var controller = creep.room.controller;
            if( !controller.owner ){
                creep.say('Claiming');
                var moveResult = creep.moveTo(controller);
                // TODO: Break Wall / Rampart
                var workResult = creep.claimController(controller);
                if( workResult == ERR_GCL_NOT_ENOUGH ){
                    workResult = creep.reserveController(controller);
                }
                return;
            }

            this.setAction(creep, 'idle');
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