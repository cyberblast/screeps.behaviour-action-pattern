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
action.newTarget = function(creep){
    const validTargets = [creep.room.storage, creep.room.terminal].filter(this.isValidTarget);
    return validTargets.length ? _.max(validTargets, 'charge') : null;
};
action.work = function(creep){
    return creep.withdraw(creep.target, RESOURCE_ENERGY);
};
action.assignDebounce = function(creep, outflowActions) {
    if (creep.data.lastAction === 'storing' && creep.data.lastTarget === creep.room.storage.id) {
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
        let target = null;
        const validAction = _.find(outflowActions, a => {
            if (a.name !== 'storing' && a.isValidAction(dummyCreep) && a.isAddableAction(dummyCreep)) {
                target = a.newTarget(dummyCreep);
                return !!target;
            }
            return false;
        });
        if (validAction && action.assign(creep)) {
            creep.data.nextAction = validAction.name;
            creep.data.nextTarget = target.id;
            return true;
        }
    } else {
        return action.assign(creep);
    }
    return false;
};
