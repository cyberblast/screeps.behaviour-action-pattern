const action = class extends Creep.Action {
    
    constructor(...args) {
        super(...args);
        
        this.maxPerTarget = 1;
        this.maxPerAction = 1;
    }
    
    getLabOrder(lab) {
        if (!lab) return;
        let order;
        const room = lab.room;
        if (!room.memory || !room.memory.resources) return;
        
        const data = room.memory.resources.lab.find(s => s.id === lab.id);
        if (!data) return;
        const orders = data.orders;
        for (const o of orders) {
            if (o.type !== RESOURCE_ENERGY && o.orderRemaining > 0 || o.storeAmount > 0) {
                order = o;
                break;
            }
        }
        return order;
    }
    
    findNeeding(room, resourceType, amountMin, structureID) {
        if (!amountMin) amountMin = 1;
        
        const labs = room.structures.labs.all;
        if (labs.length) {
            for (const labID of labs) {
                const lab = Game.structures[labID];
                const amount = lab ? lab.getNeeds(resourceType) : 0;
                if (amount >= amountMin &&
                    (!lab.mineralAmount || lab.mineralType === resourceType || resourceType === RESOURCE_ENERGY) &&
                    lab.id !== structureID) {
                    return {structure: lab, amount};
                }
            }
        }
        
        const powerSpawns = room.structures.powerSpawns.all;
        if (powerSpawns.length) {
            for (const powerSpawnID of powerSpawns) {
                const powerSpawn = Game.structures[powerSpawnID];
                const amount = powerSpawn ? powerSpawn.getNeeds(resourceType) : 0;
                if (amount >= amountMin &&
                    (resourceType === RESOURCE_POWER || resourceType === RESOURCE_ENERGY) &&
                    powerSpawn.id !== structureID) {
                    return {structure: powerSpawn, amount};
                }
            }
        }
        
        const containers = room.structures.container.all;
        if (containers.length) {
            for (const containerID of containers) {
                const container = Game.structures[containerID];
                const amount = container ? container.getNeeds(resourceType) : 0;
                if (amount >= amountMin && container.id !== structureID) {
                    return {structure: container, amount};
                }
            }
        }
        
        const terminal = room.terminal;
        if (terminal) {
            const amount = terminal.getNeeds(resourceType);
            if (amount >= amountMin && terminal.id !== structureID) {
                return {structure: terminal, amount};
            }
        }
        
        const storage = room.storage;
        if (storage) {
            const amount = storage.getNeeds(resourceType);
            if (amount >= amountMin && storage.id !== structureID) {
                return {structure: storage, amount};
            }
        }
        
        // no specific needs found ... check for overflow availability
        [storage, terminal].forEach(structure => {
            if (structure && resourceType === RESOURCE_ENERGY || resourceType === RESOURCE_POWER && structure.storeCapacity - structure.sum > amountMin) {
                return {structure, amount: 0};
            }
        });
    }
    
    newTargetLab(creep) {
        const room = creep.room;
        const data = room.memory;
        // check labs for needs and make sure to empty the lab before filling
        if (!(data && data.labs && data.labs.length)) return;
        const iTrace = DEBUG && TRACE;
        const trace = {actionName: this.name, roomName: room.name, creepName: creep.name, resourceType: lab.mineralType};
        const baseTrace = _.assign({}, trace, {structureId: d.id, needs: amount});
        for (const d of data) {
            const lab = Game.getObjectById(d.id);
            if (!lab) continue;
            let amount;
            let resourceType;
            if (lab.mineralAmount) {
                resourceType = lab.mineralType;
                amount = lab.getNeeds(resourceType);
                if (amount < 0) {
                    // lab has extra resource to be taken elsewhere
                    const needing = this.findNeeding(room, resourceType);
                    if (iTrace) Util.trace('Action', baseTrace);
                    if (needing) {
                        if (iTrace) Util.trace('Action', _.assign({}, trace, {targetStructureId: needing.structure.id, targetNeeds: needing.amount}));
                        return lab;
                    }
                }
            }
            if (!lab.mineralAmount && amount) {
                // lab is empty to check and fill order
                const order = this.getLabOrder(lab);
                if (order) {
                    // found an order
                    resourceType = order.type;
                    const amount = order.orderRemaining + order.storeAmount;
                    if (iTrace) Util.trace('Action', _.assign({}, baseTrace, {structureId: lab.id}));
                    if (room.storage && room.storage.store[resourceType]) {
                        if (iTrace) Util.trace('Action', _.assign({}, trace, {targetStructureId: room.storage.id, targetNeeds: room.storage.store[resourceType]}));
                        creep.data.reallocating = resourceType;
                        return room.storage;
                    }
                    if (room.terminal && room.terminal.getNeeds(resourceType) < 0) {
                        if (iTrace) Util.trace('Action', _.assign({}, trace, {targetStructureId: room.terminal.id, targetNeeds: room.terminal.store[resourceType]}));
                        creep.data.reallocating = resourceType;
                        return room.terminal;
                    }
                    const ret = room.findContainerWith(resourceType);
                    if (ret) {
                        if (iTrace) Util.trace('Action', _.assign({}, trace, {targetStructureId: ret.structure.id, targetNeeds: ret.amount}));
                        creep.data.reallocating = lab.mineralType;
                        return ret.structure;
                    }
                    if (ROOM_TRADING && !(lab.mineralType === RESOURCE_ENERGY || lab.mineralType === room.mineralType)) {
                        room.placeRoomOrder(lab.id, lab.mineralType, amount);
                    }
                }
            }
            resourceType = RESOURCE_ENERGY;
            amount = lab.getNeeds(resourceType);
            _.assign(baseTrace, {resourceType: resourceType});
            if (amount < 0) {
                // lab has extra energy (I guess...)
                if (iTrace) Util.trace('Action', _.assign({}, baseTrace));
                const needing = this.findNeeding(room, resourceType);
                if (needing) {
                    if (iTrace) Util.trace('Action', _.assign({}, trace, {targetStructureId: needing.structure.id, targetNeeds: needing.amount}));
                    return lab;
                }
            }
            if (amount) {
                // lab needs energy so find a lower priority container with some
                if (iTrace) Util.trace('Action', _.assign({}, baseTrace, {structureId: lab.id}));
                if (room.storage && room.storage.charge > 0.5) {
                    if (iTrace) Util.trace('Action', _.assign({}, trace, {targetStructureId: room.storage.id, targetNeeds: room.storage.store[resourceType]}));
                    creep.data.reallocating = resourceType;
                    return room.storage;
                }
                if (room.terminal && room.terminal.getNeeds(resourceType) < 0) {
                    if (iTrace) Util.trace('Action', _.assign({}, trace, {targetStructureId: room.terminal.id, targetNeeds: room.terminal.store[resourceType]}));
                    creep.data.reallocating = resourceType;
                    return room.terminal;
                }
                const ret = room.findContainerWith(resourceType);
                if (ret) {
                    if (iTrace) Util.trace('Action', _.assign({}, trace, {targetStructureId: ret.structure.id, targetNeeds: ret.amount}));
                    creep.data.reallocating = lab.mineralType;
                    return ret.structure;
                }
            }
        }
    }
    
};
module.exports = new action('reallocating');