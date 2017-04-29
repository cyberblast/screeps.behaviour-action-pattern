let mod = {};
module.exports = mod;
mod.name = 'labTech';
mod.run = function(creep) {
    // Assign next Action
    let oldTargetId = creep.data.targetId;
    if( creep.action == null || creep.action.name == 'idle' ) {
        if( creep.data.destiny && creep.data.destiny.task && Task[creep.data.destiny.task] && Task[creep.data.destiny.task].nextAction ) {
            Task[creep.data.destiny.task].nextAction(creep);
        } else {
            this.nextAction(creep);
        }
    }
    
    // Do some work
    if( creep.action && creep.target ) {
        creep.action.step(creep);
    } else {
        logError('Creep without action/activity!\nCreep: ' + creep.name + '\ndata: ' + JSON.stringify(creep.data));
    }
};
mod.nextAction = function(creep){
    if( creep.pos.roomName != creep.data.homeRoom && Game.rooms[creep.data.homeRoom] && Game.rooms[creep.data.homeRoom].controller ) {
        Creep.action.travelling.assignRoom(creep, creep.data.homeRoom);
        return;
    }
    const outflowPriority = [
        Creep.action.charging,
        Creep.action.feeding,
        Creep.action.fueling
    ];
    let priority = outflowPriority;
    if( creep.sum < creep.carryCapacity / 2 ) {
        priority = [
            Creep.action.reallocating,
            Creep.action.uncharging,
            Creep.action.picking,
            Creep.action.withdrawing,
            Creep.action.idle
        ];
    } else {
        priority = outflowPriority.concat([
            Creep.action.storing,
            Creep.action.idle,
        ]);
        if ( creep.sum > creep.carry.energy ||
            ( !creep.room.situation.invasion &&
                global.SPAWN_DEFENSE_ON_ATTACK && creep.room.conserveForDefense && creep.room.relativeEnergyAvailable > 0.8)) {
            priority.unshift(Creep.action.storing);
        }
        if (creep.room.structures.urgentRepairable.length > 0 ) {
            priority.unshift(Creep.action.fueling);
        }
    }

    for(var iAction = 0; iAction < priority.length; iAction++) {
        var a = priority[iAction];
        if(a.isValidAction(creep) && a.isAddableAction(creep)) {
            const assigned = a.assignDebounce ? a.assignDebounce(creep, outflowPriority) : a.assign(creep);
            if (assigned) {
                if (a.name !== 'idle') {
                    creep.data.lastAction = a.name;
                    creep.data.lastTarget = creep.target.id;
                }
                return;
            }
        }
    }
};
