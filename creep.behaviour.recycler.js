const mod = new Creep.Behaviour('recycler');
module.exports = mod;
const super_invalidAction = mod.invalidAction;
mod.invalidAction = function(creep) {
    if (super_invalidAction.call(this, creep) || !creep.action.isMember(mod.actions())) {
        delete creep.data.targetId;
        delete creep.data.path;
        return true;
    }
    return false;
};
mod.actions = function(creep) {
    return [
        Creep.action.picking,
        Creep.action.withdrawing,
        Creep.action.uncharging,
        Creep.action.travelling,
        Creep.action.storing,
        Creep.action.feeding,
        Creep.action.dropping,
        Creep.action.recycling,
        Creep.action.idle,
    ];
};
mod.strategies.recycling = {
    name: `recycling-${mod.name}`,
    isValidAction: function(creep){
        return !creep.sum; // only recycle when empty
    },
};
mod.strategies.uncharging = {
    name: `uncharging-${mod.name}`,
    isValidAction: function(creep){
        return (
            creep.data.travelRoom && // only gather when on mission
            creep.sum < creep.carryCapacity
        ) || false;
    },
};
mod.strategies.withdrawing = {
    name: `withdrawing-${mod.name}`,
    isValidAction: function(creep) {
        return (
            creep.data.travelRoom && // only gather when on mission
            creep.room.storage &&
            creep.room.storage.store.energy > 0 &&
            creep.sum < creep.carryCapacity
        ) || false;
    }
};
mod.strategies.travelling = {
    name: `travelling-${mod.name}`,
    newTarget: function(creep) {
        if (!creep.data.travelRoom) {
            if (creep.data.travelPos) {
                creep.data.travelRoom = creep.data.travelPos.roomName;
            } else if (creep.room.structures.spawns.length) {
                return null; // arrived
            } else {
                // TODO search for closest spawn
                creep.data.travelRoom = creep.data.homeRoom;
            }
        }
        const room = Game.rooms[creep.data.travelRoom];
        let target = room && (room.storage || room.structures.spawns[0]);
        if (!target) {
            // TODO create flag and place in room
            return creep;
        }
        return target;
    }
};
