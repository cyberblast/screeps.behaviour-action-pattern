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
        if (terminal && terminal.active) {
            const amount = terminal.getNeeds(resourceType);
            if (amount >= amountMin && terminal.id !== structureID) {
                return {structure: terminal, amount};
            }
        }
        
        const storage = room.storage;
        if (storage && storage.active) {
            const amount = storage.getNeeds(resourceType);
            if (amount >= amountMin && storage.id !== structureID) {
                return {structure: storage, amount};
            }
        }
        
        // no specific needs found ... check for overflow availability
        [storage, terminal].forEach(structure => {
            if (structure && structure.active && resourceType === RESOURCE_ENERGY || resourceType === RESOURCE_POWER && structure.storeCapacity - structure.sum > amountMin) {
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
        const trace = {actionName: this.name, roomName: room.name, creepName: creep.name};
        const baseTrace = _.assign({}, trace, {needs: amount});
        for (const d of data) {
            const lab = Game.getObjectById(d.id);
            if (!lab) continue;
            const trace = _.assign({}, trace, {resourceType: lab.mineralType});
            const baseTrace = _.assign({}, baseTrace, {structureId: d.id});
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
                    if (room.storage && room.storage.active && room.storage.store[resourceType]) {
                        if (iTrace) Util.trace('Action', _.assign({}, trace, {targetStructureId: room.storage.id, targetNeeds: room.storage.store[resourceType]}));
                        creep.data.reallocating = resourceType;
                        return room.storage;
                    }
                    if (room.terminal && room.terminal.active && room.terminal.getNeeds(resourceType) < 0) {
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
                if (room.storage && room.storage.active && room.storage.charge > 0.5) {
                    if (iTrace) Util.trace('Action', _.assign({}, trace, {targetStructureId: room.storage.id, targetNeeds: room.storage.store[resourceType]}));
                    creep.data.reallocating = resourceType;
                    return room.storage;
                }
                if (room.terminal && room.terminal.active && room.terminal.getNeeds(resourceType) < 0) {
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
    
    newTargetPowerSpawn(creep) {
        const room = creep.room;
        const powerSpawns = room.structures.powerSpawns.all;
        // check powerSpawns for needs and make sure to empty the powerSpawn before filling
        if (powerSpawns.length > 0) {
            for (const powerSpawnID of powerSpawns) {
                const powerSpawn = Game.getObjectById(powerSpawnID);
                if (!powerSpawn) continue;
                let amount = 0;
                amount = powerSpawn.getNeeds(RESOURCE_ENERGY);
                if (amount > 0) {
                    // powerSpawn needs energy so find a lower priority container with some
                    if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, structureId: powerSpawn.id, resourceType: RESOURCE_ENERGY, needs: amount });
                    if (room.storage && room.storage.active && room.storage.charge > 0.5) {
                        if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, targetStructureId: room.storage.id, resourceType: RESOURCE_ENERGY, targetNeeds: room.storage.store[RESOURCE_ENERGY] });
                        creep.data.reallocating = RESOURCE_ENERGY;
                        return room.storage;
                    }
                    if (room.terminal && room.terminal.active && room.terminal.getNeeds(RESOURCE_ENERGY) < 0) {
                        if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, targetStructureId: room.terminal.id, resourceType: RESOURCE_ENERGY, targetNeeds: room.terminal.store[RESOURCE_ENERGY] });
                        creep.data.reallocating = RESOURCE_ENERGY;
                        return room.terminal;
                    }
                    let ret = room.findContainerWith(RESOURCE_ENERGY);
                    if (ret) {
                        if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, targetStructureId: ret.structure.id, resourceType: RESOURCE_ENERGY, targetNeeds: ret.amount });
                        creep.data.reallocating = RESOURCE_ENERGY;
                        return ret.structure;
                    }
                }
                amount = powerSpawn.getNeeds(RESOURCE_POWER);
                if (amount > 0) {
                    // powerSpawn needs energy so find a lower priority container with some
                    if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, structureId: powerSpawn.id, resourceType: RESOURCE_POWER, needs: amount });
                    if (room.storage && room.storage.active && room.storage.store[RESOURCE_POWER]) {
                        if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, targetStructureId: room.storage.id, resourceType: RESOURCE_POWER, targetNeeds: room.storage.store[RESOURCE_POWER] });
                        creep.data.reallocating = RESOURCE_POWER;
                        return room.storage;
                    }
                    if (room.terminal && room.terminal.active && room.terminal.getNeeds(RESOURCE_POWER) < 0) {
                        if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, targetStructureId: room.terminal.id, resourceType: RESOURCE_POWER, targetNeeds: room.terminal.store[RESOURCE_POWER] });
                        creep.data.reallocating = RESOURCE_POWER;
                        return room.terminal;
                    }
                    let ret = room.findContainerWith(RESOURCE_POWER);
                    if (ret) {
                        if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, targetStructureId: ret.structure.id, resourceType: RESOURCE_POWER, targetNeeds: ret.amount });
                        creep.data.reallocating = RESOURCE_POWER;
                        return ret.structure;
                    }
                }
            }
        }
    }
    
    newTargetContainer(creep) {
        const room = creep.room;
        const containers = room.structures.container.all;
        // check containers for needs
        if (containers.length > 0) {
            for (const containerID of containers) {
                const container = Game.getObjectById(containerID);
                if (container) {
                    // check contents for excess
                    let resource;
                    for (resource of Object.keys(container.store)) {
                        const needs = container.getNeeds(resource);
                        if (resource && needs < 0) {
                            // container has extra resource
                            if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, structureId: container.id, resourceType: resource, needs: needs });
                            const needing = this.findNeeding(room, resource);
                            if (needing) {
                                if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, targetStructureId: needing.structure.id, resourceType: resource, targetNeeds: needing.amount });
                                creep.data.reallocating = resource;
                                return container;
                            }
                        }
                    }
                    // check orders for needs
                    if (room.memory.resources) {
                        const containerData = room.memory.resources.container.find( (s) => s.id === container.id );
                        if (containerData) {
                            const orders = containerData.orders;
                            for (const order of orders) {
                                const type = order.type;
                                const amount = container.getNeeds(type);
                                if (amount > 0) {
                                    // found a needed resource so check lower priority containers
                                    if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, structureId: container.id, resourceType: resource, needs: amount });
                                    if (room.storage && room.storage.active && room.storage.store[type] && !(type === RESOURCE_ENERGY && room.storage.charge < 0.5)) {
                                        if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, targetStructureId: room.storage.id, resourceType: resource, targetNeeds: room.storage.store[resource] });
                                        creep.data.reallocating = resource;
                                        return room.storage;
                                    }
                                    if (room.terminal && room.terminal.active && room.terminal.getNeeds(type) < 0) {
                                        if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, targetStructureId: room.terminal.id, resourceType: resource, targetNeeds: room.terminal.store[resource] });
                                        creep.data.reallocating = resource;
                                        return room.terminal;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    newTargetTerminal(creep) {
        const room = creep.room;
        // check terminal for needs
        const terminal = creep.room.terminal;
        if (terminal && terminal.active) {
            // check for excess
            for (const resource of Object.keys(terminal.store)) {
                // terminal only has too much energy or power
                //                    if (resource && (resource === RESOURCE_ENERGY || resource === RESOURCE_POWER)) {
                const amount = -terminal.getNeeds(resource);
                if (amount > 0) {
                    // excess resource found
                    if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, structureId: terminal.id, resourceType: resource, needs: -amount });
                    const dest = this.findNeeding(room, resource, 1, terminal.id);
                    if (dest && dest.structure.id !== terminal.id) {
                        if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, targetStructureId: dest.structure.id, resourceType: resource, targetNeeds: dest.amount });
                        creep.data.reallocating = resource;
                        return terminal;
                    }
                }
                //                    }
            }
            // check orders
            if (room.memory.resources && room.memory.resources.terminal[0]) {
                const orders = room.memory.resources.terminal[0].orders.slice();
                orders.push(RESOURCE_ENERGY);
                for (const order of orders) {
                    const type = order.type;
                    const amount = terminal.getNeeds(type);
                    if (amount > 0) {
                        // found a needed resource so check lower priority containers
                        if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, structureId: terminal.id, resourceType: type, needs: amount });
                        if (room.storage && room.storage.active && room.storage.store[type] && !(type === RESOURCE_ENERGY && room.storage.charge < 0.5)) {
                            if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, targetStructureId: room.storage.id, resourceType: type, targetNeeds: room.storage.store[type] });
                            creep.data.reallocating = type;
                            return room.storage;
                        }
                    }
                }
            }
        }
    }
    
    newTargetStorage(creep) {
        const room = creep.room;
        // check storage for needs
        const storage = creep.room.storage;
        if (storage && storage.active) {
            // check for excess to overflow back to terminal
            for (const resource of Object.keys(storage.store)) {
                const amount = -storage.getNeeds(resource);
                if (resource && amount > 0) {
                    if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, structureId: storage.id, resourceType: resource, needs: -amount });
                    const dest = this.findNeeding(room, resource, 1, storage.id);
                    if (dest) {
                        if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, targetStructureId: dest.structure.id, resourceType: resource, targetNeeds: dest.amount });
                        creep.data.reallocating = resource;
                        return storage;
                    }
                }
            }
            // storage is lowest priority so has nowhere local to request resources from
        }
    }
    
    isAddableAction(creep) {
        return creep.sum === 0 && super.isAddableAction(creep);
    }
    
    newTarget(creep) {
        const room = creep.room;
        if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, subAction: 'newTarget' });
        let target = null;
        if (creep.sum === 0) {
            let data = room.memory;
            if (data) {
                target = this.newTargetLab(creep);
                if (!target) target = this.newTargetPowerSpawn(creep);
                if (!target) target = this.newTargetContainer(creep);
                if (!target) target = this.newTargetTerminal(creep);
                if (!target) target = this.newTargetStorage(creep);
            }
            return target;
        } else {
            // find destination for carried resource
            let resourceType = Object.keys(creep.carry)[0];
            let needing = this.findNeeding(room, resourceType);
            if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, subAction: 'assignDropOff', targetStructureId: needing.structure.id, resourceType: resourceType, targetNeeds: needing.amount });
            return needing && needing.structure;
        }
    }
    
    cancelAction(creep) {
        delete creep.data.actionName;
        delete creep.data.targetId;
        delete creep.action;
        delete creep.target;
        delete creep.data.path;
    }
    
    unloadStructure(creep, target, resource, amount) {
        const amt = Math.min(amount,creep.carryCapacity-creep.sum);
        const workResult = creep.withdraw(target, resource, amt);
        if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: creep.room.name, creepName: creep.name, subAction: 'unloadStructure', structureId: target.id, resourceType: resource, amount: amt, result: workResult });
        return workResult;
    }
    
    loadStructure(creep, target, resource, amount) {
        let workResult ;
        const room = creep.room;
        const amt = Math.min(amount,creep.carry[resource]||0);
        if (amt > 0) workResult = creep.transfer(target, resource, amt);
        if (workResult === OK) {
            // update order
            let data = null;
            if (room.memory.resources) data = room.memory.resources[target.structureType].find((s)=>s.id === target.id);
            if (data && data.orders) {
                let order = data.orders.find(o=>o.type === resource);
                if (order && order.orderRemaining > 0) {
                    order.orderRemaining -= amt;
                }
            }
        }
        if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: creep.room.name, creepName: creep.name, subAction: 'loadStructure', structureId: target.id, resourceType: resource, amount: amt, result: workResult });
        return workResult;
    }
    
    assignDropOff(creep, resource) {
        const data = this.findNeeding(creep.room, resource, 1, creep.target.id);
        if (data) {
            if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: creep.room.name, creepName: creep.name, subAction: 'assignDropOff', targetStructureId: data.structure.id, resourceType: resource, amount: data.amount });
            this.assign(creep, data.structure);
        }
        //delete creep.data.path;
    }
    
    unloadLab(creep) {
        // load up from the lab
        const target = creep.target;
        const room = creep.room;
        let workResult;
        let resource;
        let amount;
        amount = -target.getNeeds(RESOURCE_ENERGY);
        if (amount > 0) resource = RESOURCE_ENERGY;
        if (!resource) {
            amount = -target.getNeeds(target.mineralType)
            if (amount > 0) resource = target.mineralType;
        }
        if (resource) {
            workResult = this.unloadStructure(creep, target, resource, amount);
        }
        if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating-unloadLab', roomName: room.name, creepName: creep.name, structureId: target.id, resourceType: resource, needs: amount, workResult });
        if (workResult === OK) {
            this.assignDropOff(creep, resource);
        } else this.cancelAction(creep);
        return workResult;
    }
    
    unloadPowerSpawn(creep) {
        const target = creep.target;
        const room = creep.room;
        let workResult ;
        let resource;
        let amount;
        amount = -target.getNeeds(RESOURCE_ENERGY);
        if (amount > 0) resource = RESOURCE_ENERGY;
        if (!resource) {
            amount = -target.getNeeds(RESOURCE_POWER)
            if (amount > 0) resource = RESOURCE_POWER;
        }
        if (resource) {
            workResult = this.unloadStructure(creep, target, resource, amount);
        }
        if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating-unloadPowerSpawn', roomName: room.name, creepName: creep.name, structureId: target.id, resourceType: resource, needs: amount, workResult });
        if (workResult === OK) {
            this.assignDropOff(creep, resource);
        } else this.cancelAction(creep);
        return workResult;
    }
    
    unloadContainer(creep) {
        const target = creep.target;
        const room = creep.room;
        let workResult;
        let resource;
        let amount;
        // identify resource and load up from store
        let store = Object.keys(target.store);
        if (creep.data.reallocating) {
            store.unshift(creep.data.reallocating);
            delete creep.data.reallocating;
        }
        for (const res of store) {
            if (res && target.store[res] > 0 && (target.structureType === STRUCTURE_LAB || target.getNeeds(res) < 0)) {
                let dat = this.findNeeding(room, res, 1, target.id);
                //if (dat && dat.structure.id === target.id) dat = null;
                if (dat) {
                    amount = dat.amount;
                }
                //if (!amount) amount = -this.terminalNeeds(target, res);
                if (amount > 0) {
                    resource = res;
                    break;
                } else if (storage && storage.active && dat && dat.structure.structureType === STRUCTURE_STORAGE && res === RESOURCE_ENERGY) {
                    amount = storage.storeCapacity-storage.sum;
                    resource = res;
                    break;
                }
            }
        }
        if (resource) {
            workResult = this.unloadStructure(creep, target, resource, amount);
        }
        if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating-unloadContainer', roomName: room.name, creepName: creep.name, structureId: target.id, resourceType: resource, needs: amount, workResult });
        if (workResult === OK) {
            this.assignDropOff(creep, resource);
        } else this.cancelAction(creep);
        return workResult;
    }
    
    unloadTerminal(creep) {
        const target = creep.target;
        const room = creep.room;
        const storage = room.storage;
        let workResult;
        let resource;
        let amount;
        // identify resource and load up from store
        let store = Object.keys(target.store);
        if (creep.data.reallocating) {
            store.unshift(creep.data.reallocating);
            delete creep.data.reallocating;
        }
        for (const res of store) {
            if (res && target.store[res] > 0 && (target.structureType === STRUCTURE_LAB || target.getNeeds(res) < 0)) {
                let dat = this.findNeeding(room, res, 1, target.id);
                //if (dat && dat.structure.id === target.id) dat = null;
                if (dat) {
                    amount = dat.amount;
                }
                //if (!amount) amount = -this.terminalNeeds(target, res);
                if (amount > 0) {
                    resource = res;
                    break;
                } else if (storage && storage.active && dat && dat.structure.structureType === STRUCTURE_STORAGE && res === RESOURCE_ENERGY) {
                    amount = storage.storeCapacity-storage.sum;
                    resource = res;
                    break;
                }
            }
        }
        if (resource) {
            amount = Math.min(amount,target.store[resource]||0,creep.carryCapacity-creep.sum);
            workResult = this.unloadStructure(creep, target, resource, amount);
        }
        if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating-unloadTerminal', roomName: room.name, creepName: creep.name, structureId: target.id, resourceType: resource, needs: amount, workResult });
        if (workResult === OK) {
            this.assignDropOff(creep, resource);
        } else this.cancelAction(creep);
        return workResult;
    }
    
    unloadStorage(creep) {
        const target = creep.target;
        const room = creep.room;
        const terminal = room.terminal;
        let workResult;
        let resource;
        let amount;
        // check for other container's needs and local excess
        let store = Object.keys(target.store);
        if (creep.data.reallocating) {
            store.unshift(creep.data.reallocating);
            delete creep.data.reallocating;
        }
        for (const res of store) {
            if (res && target.store[res] > 0) {
                if (res === RESOURCE_ENERGY && target.charge < 0.5) continue;
                let dat = this.findNeeding(room, res, 1, target.id);
                if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', subAction: 'findNeeding', roomName: room.name, creepName: creep.name, structureId: dat && dat.structure.id, resourceType: res, amount: dat && dat.amount });
                if (dat && dat.structure.id === target.id) dat = null;
                if (dat) {
                    amount = dat.amount;
                }
                //if (!amount) amount = -this.storageNeeds(target, res);
                if (amount > 0) {
                    resource = res;
                    break;
                } else if (terminal && terminal.active && dat && dat.structure.structureType === STRUCTURE_TERMINAL && res !== RESOURCE_ENERGY && res !== RESOURCE_POWER) {
                    amount = terminal.storeCapacity-terminal.sum;
                    resource = res;
                    break;
                }
            }
        }
        if (resource) {
            amount = Math.min(amount,target.store[resource]||0,creep.carryCapacity-creep.sum);
            workResult = this.unloadStructure(creep, target, resource, amount);
        }
        if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating-unloadStorage', roomName: room.name, creepName: creep.name, structureId: target.id, resourceType: resource, needs: amount, workResult });
        if (workResult === OK) {
            this.assignDropOff(creep, resource);
        } else this.cancelAction(creep);
        return workResult;
    }
    
    loadLab(creep) {
        const target = creep.target;
        const room = creep.room;
        let workResult;
        let resource;
        let amount;
        // drop off at lab
        amount = target.getNeeds(RESOURCE_ENERGY);
        if (amount > 0 && (creep.carry.energy||0) > 0) {
            resource = RESOURCE_ENERGY;
        } else {
            let order = this.getLabOrder(target);
            if (order) resource = order.type;
            amount = target.getNeeds(resource);
            if (!(amount > 0 && (creep.carry[resource]||0) > 0)) {
                resource = null;
            }
        }
        if (resource) workResult = this.loadStructure(creep, target, resource, amount);
        if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating-loadLab', roomName: room.name, creepName: creep.name, structureId: target.id, resourceType: resource, needs: amount, workResult });
        
        if ((creep.carry[resource]||0) > amount) {
            this.assignDropOff(creep, resource);
        } else {
            this.cancelAction(creep);
        }
        return workResult;
    }
    
    loadPowerSpawn(creep) {
        const target = creep.target;
        const room = creep.room;
        let workResult;
        let resource;
        let amount;
        // drop off at powerSpawn
        if (room.memory.resources && room.memory.resources.powerSpawn === undefined) room.memory.resources.powerSpawn = [];
        amount = target.getNeeds(RESOURCE_ENERGY);
        if (amount > 0 && (creep.carry.energy||0) > 0) {
            resource = RESOURCE_ENERGY;
        } else {
            amount = target.getNeeds(RESOURCE_POWER);
            if (amount > 0 && (creep.carry[RESOURCE_POWER]||0) > 0) {
                resource = RESOURCE_POWER;
            }
        }
        if (resource) workResult = this.loadStructure(creep, target, resource, amount);
        if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating-loadPowerSpawn', roomName: room.name, creepName: creep.name, structureId: target.id, resourceType: resource, needs: amount, workResult });
        
        if ((creep.carry[resource]||0) > amount) {
            this.assignDropOff(creep, resource);
        } else {
            this.cancelAction(creep);
        }
        return workResult;
    }
    
    loadContainer(creep) {
        const target = creep.target;
        const room = creep.room;
        let workResult;
        let resource;
        let amount;
        // drop off at store
        for (const res of Object.keys(creep.carry)) {
            if (res && creep.carry[res] === 0) continue;
            amount = target.getNeeds(res);
            if (amount > 0) {
                resource = res;
                break;
            }
        }
        if (resource) workResult = this.loadStructure(creep, target, resource, amount);
        if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating-loadContainer', roomName: room.name, creepName: creep.name, structureId: target.id, resourceType: resource, needs: amount, workResult });
        
        if ((creep.carry[resource]||0) > amount) {
            this.assignDropOff(creep, resource);
        } else {
            this.cancelAction(creep);
        }
        return workResult;
    }
    
    loadTerminal(creep) {
        const target = creep.target;
        const room = creep.room;
        let workResult;
        let resource;
        let amount;
        // drop off at store
        for (const res of Object.keys(creep.carry)) {
            if (res && creep.carry[res] === 0) continue;
            amount = target.getNeeds(res);
            if (amount > 0) {
                resource = res;
                break;
            } else if (res !== RESOURCE_ENERGY && res !== RESOURCE_POWER) {
                resource = res;
                amount = target.storeCapacity-target.sum;
                break;
            }
        }
        if (resource) workResult = this.loadStructure(creep, target, resource, amount);
        if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating-loadTerminal', roomName: room.name, creepName: creep.name, structureId: target.id, resourceType: resource, needs: amount, workResult });
        if ((creep.carry[resource]||0) > amount) {
            this.assignDropOff(creep, resource);
        } else {
            this.cancelAction(creep);
        }
        return workResult;
    }
    
    loadStorage(creep) {
        const target = creep.target;
        const room = creep.room;
        let workResult;
        let resource;
        let amount;
        // drop off at store
        for (const res of Object.keys(creep.carry)) {
            if (res && creep.carry[res] === 0) continue;
            amount = target.getNeeds(res);
            if (amount > 0) {
                resource = res;
                break;
            }
        }
        if (resource) workResult = this.loadStructure(creep, target, resource, amount);
        if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating-loadStorage', roomName: room.name, creepName: creep.name, structureId: target.id, resourceType: resource, needs: amount, workResult });
        if ((creep.carry[resource]||0) > amount) {
            this.assignDropOff(creep, resource);
        } else {
            this.cancelAction(creep);
        }
        return workResult;
    }
    
    work(creep) {
        let workResult;
        const target = creep.target;
        
        if (creep.sum === 0) {
            switch (target.structureType) {
                case STRUCTURE_LAB:
                    workResult = this.unloadLab(creep);
                    break;
                case STRUCTURE_POWER_SPAWN:
                    // cannot unload a powerSpawn
                    this.cancelAction(creep);
                    break;
                case STRUCTURE_CONTAINER:
                    workResult = this.unloadContainer(creep);
                    break;
                case STRUCTURE_TERMINAL:
                    workResult = this.unloadTerminal(creep);
                    break;
                case STRUCTURE_STORAGE:
                    workResult = this.unloadStorage(creep);
                    break;
                default:
                    this.cancelAction(creep);
                    break;
            }
        } else {
            switch (target.structureType) {
                case STRUCTURE_LAB:
                    workResult = this.loadLab(creep);
                    break;
                case STRUCTURE_POWER_SPAWN:
                    workResult = this.loadPowerSpawn(creep);
                    break;
                case STRUCTURE_CONTAINER:
                    workResult = this.loadContainer(creep);
                    break;
                case STRUCTURE_TERMINAL:
                    workResult = this.loadTerminal(creep);
                    break;
                case STRUCTURE_STORAGE:
                    workResult = this.loadStorage(creep);
                    break;
                default:
                    this.cancelAction(creep);
                    break;
            }
        }
        return workResult;
    };
    
};
module.exports = new action('reallocating');