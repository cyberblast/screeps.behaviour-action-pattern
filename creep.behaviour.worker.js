let mod = new Creep.Behaviour('worker');
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
    let priority = [
        Creep.action.picking,
        Creep.action.dismantling,
        Creep.action.withdrawing,
        Creep.action.uncharging,
        Creep.action.harvesting,
        Creep.action.reallocating
    ];
    if (creep.sum > creep.carry.energy) {
        priority.unshift(Creep.action.storing);
    }
    return priority;
};
mod.outflowActions = (creep) => {
    if( creep.room.situation.invasion && creep.room.controller && creep.room.controller.level > 2 ) {
        return [
            Creep.action.fueling,
            Creep.action.feeding,
            Creep.action.repairing
        ];
    } else {
        let priority = [
            Creep.action.repairing,
            Creep.action.feeding,
            Creep.action.building,
            Creep.action.fueling,
            Creep.action.fortifying,
            Creep.action.charging,
            Creep.action.upgrading,
            Creep.action.storing,
            Creep.action.picking
        ];
        const needMinersOrHaulers = (room) => {
            const typeCount = room.population && room.population.typeCount;
            return !typeCount.hauler || typeCount.hauler < 1 || !typeCount.miner || typeCount.miner < 1;
        };
        if (creep.room.relativeEnergyAvailable < 1 && needMinersOrHaulers(creep.room)) {
            priority.unshift(Creep.action.feeding);
        }
        if (creep.room.controller && creep.room.controller.ticksToDowngrade < 2000) { // urgent upgrading
            priority.unshift(Creep.action.upgrading);
        }
        if (creep.sum > creep.carry.energy) {
            priority.unshift(Creep.action.storing);
        }
        return priority;
    }
};
mod.nextAction = function(creep){
    if( creep.data.creepType == "worker" && creep.pos.roomName != creep.data.homeRoom && Game.rooms[creep.data.homeRoom] && Game.rooms[creep.data.homeRoom].controller ) {
        if( DEBUG && TRACE ) trace('Behaviour', {actionName:'travelling', behaviourName:this.name, creepName:creep.name, assigned: true, Behaviour:'nextAction', Action:'assign'});
        Creep.action.travelling.assignRoom(creep, creep.data.homeRoom);
        return true;
    }
    if( creep.sum < (creep.carryCapacity*0.5) ) {
        return mod.selectInflowAction(creep);
    } else {
        return mod.selectAction(creep, mod.outflowActions);
    }
};
