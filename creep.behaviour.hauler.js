const mod = new Creep.Behaviour('hauler');
module.exports = mod;
mod.run = function(creep) {
    // Assign next Action
    let oldTargetId = creep.data.targetId;
    if( creep.action == null || creep.action.name == 'idle' ) {
        this.nextAction(creep);
    }
    
    // Do some work
    if( creep.action && creep.target ) {
        creep.action.step(creep);
    } else {
        logError('Creep without action/activity!\nCreep: ' + creep.name + '\ndata: ' + JSON.stringify(creep.data));
    }
};
mod.inflowActions = (creep) => {
    return [
        Creep.action.uncharging,
        Creep.action.picking,
        Creep.action.withdrawing,
        Creep.action.reallocating
    ];
};
mod.outflowActions = (creep) => {
    let priority = [
        Creep.action.feeding,
        Creep.action.charging,
        Creep.action.fueling,
        Creep.action.storing
    ];
    if ( creep.sum > creep.carry.energy ||
            ( !creep.room.situation.invasion &&
                SPAWN_DEFENSE_ON_ATTACK && creep.room.conserveForDefense && creep.room.relativeEnergyAvailable > 0.8)) {
        priority.unshift(Creep.action.storing);
    }
    if (creep.room.structures.urgentRepairable.length > 0 ) {
        priority.unshift(Creep.action.fueling);
    }
    return priority;
};
mod.nextAction = function(creep){
    if( creep.pos.roomName != creep.data.homeRoom && Game.rooms[creep.data.homeRoom] && Game.rooms[creep.data.homeRoom].controller ) {
        Creep.action.travelling.assignRoom(creep, creep.data.homeRoom);
        return;
    }
    if (creep.sum < creep.carryCapacity / 2)
        return mod.selectInflowAction(creep);
    else
        return mod.selectAction(creep, mod.outflowActions(creep));
};
