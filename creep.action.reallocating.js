const action = new Creep.Action('reallocating');
module.exports = action;
/**
  * Finds a destination for the given resource type and amount
  * @param {Creep} creep - The creep object that is performing this action.
  * @param {String} resourceType - The type of resource to find a destination for, if undefined this will also find and return a source.
  * @returns {structure, amount} - target structure and amoun tof resource
  */
action.findNeeding = function(creep, resourceType, amountMin){
    const room = creep.room;
    if (!amountMin) amountMin = 1;

    // search structures in order labs -> powerSpawns -> containers -> terminals -> storage
    const validLabs = _.filter(room.structures.labs.all, l => l.mineralAmount === 0 || l.mineralType === resourceType || resourceType === RESOURCE_ENERGY);
    const structures = [...validLabs];
    if (resourceType === RESOURCE_ENERGY || resourceType === RESOURCE_POWER) structures.push([...room.structures.powerSpawns.all]);
    structures.push(...room.structures.container.all);
    if (room.terminal) structures.push(room.terminal);
    if (room.storage) structures.push(room.storage);

    for (const structure of structures) {
        if (structure) {
            const amount = structure.getNeeds(resourceType);
            if (amount >= amountMin)
                return {structure, amount};
        }
    }

    // no specific needs found ... check for overflow availability
    // FIXME: Can this and terminal just be handled by creep.action.storing?
    if (room.storage && storage.storeCapacity - storage.sum > amountMin)
        return {structure: room.storage, amount: creep.carryCapacity - creep.sum};

    if (room.terminal && resourceType !== RESOURCE_ENERGY && resourceType !== RESOURCE_POWER && terminal.storeCapacity - terminal.sum > amountMin)
        return {structure: room.terminal, amount: creep.carryCapacity - creep.sum};

    // no destination found
    return null;
};
// FIXME: Can this use baseOf or something?
const _isAddableAction = this.isAddableAction;
action.isAddableAction = function(creep){
    return creep.sum > 0 && _isAddableAction(creep);
};
this.isValidAction = function(creep){
    return creep.sum > 0;
};
action.hasNeeds = function(creep, resourceType) {
    if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, subAction: 'hasNeeds' });
    return action.findNeeding(creep.room, resourceType);
};
action.newTarget = function(creep) {
    if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, subAction: 'newTarget' });
    for (const resourceType in creep.carry) {
        if (creep.carry[resourceType] > 0) {
            const needing = action.findNeeding(creep.room, resourceType);
            if (needing) return needing.structure;
        }
    }
    return null;
};
action.work = function(creep) {
    let amount = 0;
    for (const resourceType in creep.carry) {
        if (creep.carry[resourceType] > 0) {
            amount = creep.target.getNeeds(resourceType);
            if (amount > 0) {
                const workResult = creep.transfer(creep.target, resource, amount);
                if (workResult == OK) {
                    target.orderSatisfied(resourceType, amount);
                    break;
                }
            }
        }
    }
    if (DEBUG && TRACE) trace('Action', {actionName: 'reallocating', roomName: creep.room.name, creepName: creep.name, structureId: creep.target.id, resourceType: resource, amount: amount, result: workResult });
    return workResult;
};
action.onAssignment = function(creep, target) {
    if( SAY_ASSIGNMENT ) creep.say(String.fromCharCode(8660), SAY_PUBLIC);
};