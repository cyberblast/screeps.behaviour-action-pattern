const mod = new Creep.Behaviour('remoteWorker');
module.exports = mod;
mod.run = function(creep) {
    if (Creep.action.avoiding.run(creep)) {
        return;
    }

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
        Creep.action.picking,
        Creep.action.uncharging,
        Creep.action.withdrawing,
        Creep.action.harvesting
    ];
};
mod.outflowActions = (creep) => {
    return [
        Creep.action.repairing,
        Creep.action.building,
        Creep.action.recycling
    ];
};
mod.nextAction = function(creep) {
    // at target room
    if (creep.data.destiny.room == creep.pos.roomName) {
        if (creep.sum < creep.carryCapacity * 0.8) {
            // get some energy
            return mod.selectInflowAction(creep);
        } else {
            return mod.selectAction(creep, mod.outflowActions(creep));
        }
    } else { // not at target room
        return this.gotoTargetRoom(creep);
    }
    // fallback
    // recycle self
    let mother = Game.spawns[creep.data.motherSpawn];
    if( mother ) {
        Creep.action.recycling.assign(creep, mother);
    }
};
mod.gotoTargetRoom = function(creep){
    const targetFlag = creep.data.destiny ? Game.flags[creep.data.destiny.targetName] : null;
    if (targetFlag) return Creep.action.travelling.assignRoom(creep, targetFlag.pos.roomName);
};
