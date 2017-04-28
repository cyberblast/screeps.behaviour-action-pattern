let action = new Creep.Action('withdrawing');
module.exports = action;
action.isValidAction = function(creep){
    return (
        ((creep.room.storage && creep.room.storage.store[RESOURCE_ENERGY]) ||
        (creep.room.terminal && creep.room.terminal.store[RESOURCE_ENERGY])) &&
        creep.data.creepType !== 'privateer' &&
        creep.sum < creep.carryCapacity &&
        (!creep.room.conserveForDefense || creep.room.relativeEnergyAvailable < 0.8)
    );
};
action.isValidTarget = function(target){
    if (target instanceof StructureTerminal && target.charge <= 0) return false;
    return target && !!target.store && target.store[RESOURCE_ENERGY];
};
action.newTarget = function(creep) {
    const terminal = creep.room.terminal;
    const storage = creep.room.storage;
    if (terminal && Creep.action.withdrawing.isValidTarget(terminal)) {
        return terminal;
    } else if (terminal || storage) {
        return _.max([terminal, storage], 'charge');
    }
    return false;
};
action.work = function(creep){
    return creep.withdraw(creep.target, RESOURCE_ENERGY);
};
action.assignDebounce = function(creep, outflowActions) {
    const withdrawTarget = action.newTarget(creep);
    if (withdrawTarget) {
        if (withdrawTarget instanceof StructureStorage && creep.data.lastAction === 'storing' && creep.data.lastTarget === creep.room.storage.id) {
            // cycle detected
            const dummyCreep = {
                carry:{},
                owner: creep.owner,
                pos: creep.pos,
                room: creep.room,
                sum: creep.carryCapacity
            };
            const stored = creep.room.storage.store[RESOURCE_ENERGY];
            const maxWithdraw = stored > creep.carryCapacity ? creep.carryCapacity : stored;
            dummyCreep.carry[RESOURCE_ENERGY] = maxWithdraw; // assume we get a full load of energy
            let nextTarget = null;
            const validAction = _.find(outflowActions, a => {
                if (a.name !== 'storing' && a.isValidAction(dummyCreep) && a.isAddableAction(dummyCreep)) {
                    nextTarget = a.newTarget(dummyCreep);
                    return !!nextTarget;
                }
                return false;
            });
            if (validAction && action.assign(creep, withdrawTarget)) {
                creep.data.nextAction = validAction.name;
                creep.data.nextTarget = nextTarget.id;
                return true;
            }
        } else {
            return action.assign(creep, withdrawTarget);
        }
    }
    return false;
};
