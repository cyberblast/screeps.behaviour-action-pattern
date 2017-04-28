let mod = {};
module.exports = mod;
mod.name = 'recycler';
mod.run = function(creep) {
    // Assign next Action
    if( !creep.action || creep.action.name === 'idle' || !creep.action.isMember(mod.actionPriority()) ) {
        delete creep.data.targetId;
        delete creep.data.path;
        this.nextAction(creep);
    }

    // Do some work
    if( creep.action && creep.target ) {
        creep.action.step(creep);
    } else {
        logError('Creep without action/activity!\nCreep: ' + creep.name + '\ndata: ' + JSON.stringify(creep.data));
    }
};
mod.actionPriority = function() {
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
mod.nextAction = function(creep){
    const priority = mod.actionPriority();

    for(var iAction = 0; iAction < priority.length; iAction++) {
        var action = priority[iAction];
        if(action.isValidAction(creep) &&
            action.isAddableAction(creep) &&
            action.assign(creep)) {
            return;
        }
    }
};
mod.strategies = {
    defaultStrategy: {
        name: `default-${mod.name}`,
    },
    recycling: {
        name: `recycling-${mod.name}`,
        isValidAction: function(creep){
            return !creep.sum; // only recycle when empty
        },
    },
    uncharging: {
        name: `uncharging-${mod.name}`,
        isValidAction: function(creep){
            return (
                creep.data.travelRoom && // only gather when on mission
                creep.sum < creep.carryCapacity
            ) || false;
        },
    },
    withdrawing: {
        name: `withdrawing-${mod.name}`,
        isValidAction: function(creep) {
            return (
                creep.data.travelRoom && // only gather when on mission
                creep.room.storage &&
                creep.room.storage.store.energy > 0 &&
                creep.sum < creep.carryCapacity
            ) || false;
        }
    },
    travelling: {
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
        },
    },
};
mod.selectStrategies = function(actionName) {
    return [mod.strategies.defaultStrategy, mod.strategies[actionName]];
};
