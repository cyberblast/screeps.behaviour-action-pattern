const mod = new Creep.Behaviour('worker');
module.exports = mod;
mod.inflowActions = function(creep) {
    let priority = [
        Creep.action.bulldozing,
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
mod.outflowActions = function(creep) {
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
        priority.unshift(Creep.action.bulldozing);
        return priority;
    }
};
mod.nextAction = function(creep) {
    if( creep.data.creepType == "worker" && creep.pos.roomName != creep.data.homeRoom && Game.rooms[creep.data.homeRoom] && Game.rooms[creep.data.homeRoom].controller ) {
        if( global.DEBUG && global.TRACE ) trace('Behaviour', {actionName:'travelling', behaviourName:this.name, creepName:creep.name, assigned: true, Behaviour:'nextAction', Action:'assign'});
        Creep.action.travelling.assignRoom(creep, creep.data.homeRoom);
        return true;
    }
    return this.nextEnergyAction(creep);
};
