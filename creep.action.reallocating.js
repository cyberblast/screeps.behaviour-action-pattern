let action = new Creep.Action('reallocating');
module.exports = action;
action.maxPerTarget = 1;
action.maxPerAction = 1;
action.getLabOrder = function(lab) {
    if (!lab) return null;
    var order = null;
    let room = lab.room;
    if (!room.memory || !room.memory.resources) return null;

    let data = room.memory.resources.lab.find( (s) => s.id == lab.id );
    if (data) {
        let orders = data.orders;
        for (var i=0;i<orders.length;i++) {
            if (orders[i].type != RESOURCE_ENERGY &&
                    (orders[i].orderRemaining > 0 ||
                    orders[i].storeAmount > 0)) {
                order = orders[i];
                break;
            }
        }
    }

    return order;
};
action.findNeeding = function(room, resourceType, amountMin, structureId){
    if (!amountMin) amountMin = 1;
//    if (!RESOURCES_ALL.find((r)=>{r==resourceType;})) return ERR_INVALID_ARGS;

    const labs = room.structures.labs.all;
    if (labs.length > 0) {
        for (let i = 0; i < labs.length; i++) {
            const lab = Game.getObjectById(labs[i].id);
            let amount = 0;
            if (lab) amount = lab.getNeeds(resourceType);
            if (amount >= amountMin && (lab.mineralAmount === 0 || lab.mineralType == resourceType || resourceType == RESOURCE_ENERGY) && lab.id != structureId) {
                return { structure: lab, amount: amount};
            }
        }
    }
    const powerSpawns = room.structures.powerSpawns.all;
    if (powerSpawns.length > 0) {
        for (let i = 0; i < powerSpawns.length; i++) {
            const powerSpawn = Game.getObjectById(powerSpawns[i].id);
            let amount = 0;
            if (powerSpawn) amount = powerSpawn.getNeeds(resourceType);
            if (amount >= amountMin && (resourceType == RESOURCE_POWER || resourceType == RESOURCE_ENERGY) && powerSpawn.id != structureId) {
                return { structure: powerSpawn, amount: amount};
            }
        }
    }
    const containers = room.structures.container.all;
    if (containers.length > 0) {
        for (let i = 0; i < containers.length; i++) {
            const container = Game.getObjectById(containers[i].id);
            let amount = 0;
            if (container) amount = container.getNeeds(resourceType);
            if (amount >= amountMin && container.id != structureId) {
                return { structure: container, amount: amount };   
            }
        }
    }
    const terminal = room.terminal;
    if (terminal && terminal.isActive()) {
        let amount = terminal.getNeeds(resourceType);
        if (amount >= amountMin && terminal.id != structureId) {
            return { structure: terminal, amount: amount };
        }
    }
    let storage = room.storage;
    if (storage && storage.isActive()) {
        let amount = storage.getNeeds(resourceType);
        if (amount >= amountMin && storage.id != structureId) {
            return { structure: storage, amount: amount };
        }
    }

    // no specific needs found ... check for overflow availability
    if (storage && storage.isActive() && (resourceType == RESOURCE_ENERGY || resourceType == RESOURCE_POWER) && storage.storeCapacity-storage.sum > amountMin) {
        return { structure: storage, amount: 0 };
    }
    if (terminal && terminal.isActive() && resourceType != RESOURCE_ENERGY && resourceType != RESOURCE_POWER && terminal.storeCapacity-terminal.sum > amountMin) {
        return { structure: terminal, amount: 0 };
    }
    
    // no destination found
    return null;
};
action.newTargetLab = function(creep) {
    let room = creep.room;
    let data = room.memory;
    // check labs for needs and make sure to empty the lab before filling
    if (data && data.labs && data.labs.length > 0) {
        for (var i=0;i<data.labs.length;i++) {
            let d = data.labs[i];
            let lab = Game.getObjectById(d.id);
            if (!lab) continue;
            var amount = 0;
            if (lab.mineralAmount > 0) {
                amount = lab.getNeeds(lab.mineralType);
                if (amount < 0) {
                    // lab has extra resource to be taken elsewhere
                    var needing;
                    if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, structureId: lab.id, resourceType: lab.mineralType, needs: amount });
                    needing = this.findNeeding(room,lab.mineralType);
                    if (needing) {
                        if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, targetStructureId: needing.structure.id, resourceType: lab.mineralType, targetNeeds: needing.amount });
                        return lab;
                    }
                }
                if (amount > 0) {
                    // lab needs more resource so find a lower priority container with some
                    if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, structureId: lab.id, resourceType: lab.mineralType, needs: amount });
                    if (room.storage && room.storage.isActive() && room.storage.store[lab.mineralType]) {
                        if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, targetStructureId: room.storage.id, resourceType: lab.mineralType, targetNeeds: room.storage.store[lab.mineralType] });
                        creep.data.reallocating = lab.mineralType;
                        return room.storage;
                    }
                    if (room.terminal && room.terminal.isActive() && room.terminal.getNeeds(lab.mineralType) < 0) {
                        if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, targetStructureId: room.terminal.id, resourceType: lab.mineralType, targetNeeds: room.terminal.store[lab.mineralType] });
                        creep.data.reallocating = lab.mineralType;
                        return room.terminal;
                    }
                    let ret = room.findContainerWith(lab.mineralType);
                    if (ret) {
                        if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, targetStructureId: ret.structure.id, resourceType: lab.mineralType, targetNeeds: ret.amount });
                        creep.data.reallocating = lab.mineralType;
                        return ret.structure;
                    }
                    if (ROOM_TRADING && !(lab.mineralType == RESOURCE_ENERGY || lab.mineralType == room.mineralType)) {
                        room.placeRoomOrder(lab.id,lab.mineralType,amount);
                    }
                }
            } else {
                // lab is empty so check and fill order
                let order = this.getLabOrder(lab);
                let resourceType = null;
                if (order) {
                    // found an order
                    resourceType = order.type;
                    var amount = order.orderRemaining+order.storeAmount;
                    if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, structureId: lab.id, resourceType: resourceType, needs: amount });
                    if (room.storage && room.storage.isActive() && room.storage.store[resourceType]) {
                        if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, targetStructureId: room.storage.id, resourceType: resourceType, targetNeeds: room.storage.store[resourceType] });
                        creep.data.reallocating = resourceType;
                        return room.storage;
                    }
                    if (room.terminal && room.terminal.isActive() && room.terminal.getNeeds(resourceType) < 0) {
                        if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, targetStructureId: room.terminal.id, resourceType: resourceType, targetNeeds: room.terminal.store[resourceType] });
                        creep.data.reallocating = resourceType;
                        return room.terminal;
                    }
                    let ret = room.findContainerWith(resourceType);
                    if (ret) {
                        if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, targetStructureId: ret.structure.id, resourceType: resourceType, targetNeeds: ret.amount });
                        creep.data.reallocating = resourceType;
                        return ret.structure;
                    }
                    if (ROOM_TRADING && !(resourceType == RESOURCE_ENERGY || resourceType == room.mineralType)) {
                        room.placeRoomOrder(lab.id,resourceType,order.orderRemaining);
                    }
                }
            }
            amount = lab.getNeeds(RESOURCE_ENERGY);
            if (amount < 0) {
                // lab has extra energy (I guess ...)
                if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, structureId: lab.id, resourceType: RESOURCE_ENERGY, needs: amount });
                var needing = this.findNeeding(room, RESOURCE_ENERGY);
                if (needing) {
                    if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, targetStructureId: needing.structure.id, resourceType: RESOURCE_ENERGY, targetNeeds: needing.amount });
                    return lab;
                }
            }
            if (amount > 0) {
                // lab needs energy so find a lower priority container with some
                if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, structureId: lab.id, resourceType: RESOURCE_ENERGY, needs: amount });
                if (room.storage && room.storage.isActive() && room.storage.charge > 0.5) {
                    if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, targetStructureId: room.storage.id, resourceType: RESOURCE_ENERGY, targetNeeds: room.storage.store[RESOURCE_ENERGY] });
                    creep.data.reallocating = RESOURCE_ENERGY;
                    return room.storage;
                }
                if (room.terminal && room.terminal.isActive() && room.terminal.getNeeds(RESOURCE_ENERGY) < 0) {
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
        }
    }
    return null;
};
action.newTargetPowerSpawn = function(creep) {
    const room = creep.room;
    const powerSpawns = room.structures.powerSpawns.all;
    // check powerSpawns for needs and make sure to empty the powerSpawn before filling
    if (powerSpawns.length > 0) {
        for (var i = 0; i < powerSpawns.length; i++) {
            const powerSpawn = Game.getObjectById(powerSpawns[i].id);
            if (!powerSpawn) continue;
            var amount = 0;
            amount = powerSpawn.getNeeds(RESOURCE_ENERGY);
            if (amount > 0) {
                // powerSpawn needs energy so find a lower priority container with some
                if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, structureId: powerSpawn.id, resourceType: RESOURCE_ENERGY, needs: amount });
                if (room.storage && room.storage.isActive() && room.storage.charge > 0.5) {
                    if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, targetStructureId: room.storage.id, resourceType: RESOURCE_ENERGY, targetNeeds: room.storage.store[RESOURCE_ENERGY] });
                    creep.data.reallocating = RESOURCE_ENERGY;
                    return room.storage;
                }
                if (room.terminal && room.terminal.isActive() && room.terminal.getNeeds(RESOURCE_ENERGY) < 0) {
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
                if (room.storage && room.storage.isActive() && room.storage.store[RESOURCE_POWER]) {
                    if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, targetStructureId: room.storage.id, resourceType: RESOURCE_POWER, targetNeeds: room.storage.store[RESOURCE_POWER] });
                    creep.data.reallocating = RESOURCE_POWER;
                    return room.storage;
                }
                if (room.terminal && room.terminal.isActive() && room.terminal.getNeeds(RESOURCE_POWER) < 0) {
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
    return null;
};
action.newTargetContainer = function(creep) {
    const room = creep.room;
    const containers = room.structures.container.all;
    // check containers for needs
    if (containers.length > 0) {
        for (var i = 0; i < containers.length; i++) {
            const container = Game.getObjectById(containers[i].id);
            if (container) {
                // check contents for excess
                for(var resource in container.store) {
                    var needs = container.getNeeds(resource);
                    if (resource && needs < 0) {
                        // container has extra resource
                        if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, structureId: container.id, resourceType: resource, needs: needs });
                        var needing = this.findNeeding(room, resource);
                        if (needing) {
                            if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, targetStructureId: needing.structure.id, resourceType: resource, targetNeeds: needing.amount });
                            creep.data.reallocating = resource;
                            return container;
                        }
                    }
                }
                // check orders for needs
                if (room.memory.resources) {
                    let containerData = room.memory.resources.container.find( (s) => s.id == container.id );
                    if (containerData) {
                        let orders = containerData.orders;
                        for (var j = 0; j < orders.length; j++) {
                            let type = orders[j].type;
                            let amount = container.getNeeds(type);
                            if (amount > 0) {
                                // found a needed resource so check lower priority containers
                                if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, structureId: container.id, resourceType: resource, needs: amount });
                                if (room.storage && room.storage.isActive() && room.storage.store[type] && !(type == RESOURCE_ENERGY && room.storage.charge < 0.5)) {
                                    if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, targetStructureId: room.storage.id, resourceType: resource, targetNeeds: room.storage.store[resource] });
                                    creep.data.reallocating = resource;
                                    return room.storage;
                                }
                                if (room.terminal && room.terminal.isActive() && room.terminal.getNeeds(type) < 0) {
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
    return null;
};
action.newTargetTerminal = function(creep) {
    let room = creep.room;
    // check terminal for needs
    let terminal = creep.room.terminal;
    if (terminal && terminal.isActive()) {
        // check for excess
        for (var resource in terminal.store) {
            // terminal only has too much energy or power
//                    if (resource && (resource == RESOURCE_ENERGY || resource == RESOURCE_POWER)) {
                let amount = -terminal.getNeeds(resource);
                if (amount > 0) {
                    // excess resource found
                    if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, structureId: terminal.id, resourceType: resource, needs: -amount });
                    let dest = this.findNeeding(room, resource, 1, terminal.id);
                    if (dest && dest.structure.id != terminal.id) {
                        if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, targetStructureId: dest.structure.id, resourceType: resource, targetNeeds: dest.amount });
                        creep.data.reallocating = resource;
                        return terminal;
                    }
                }
//                    }
        }
        // check orders
        if (room.memory.resources && room.memory.resources.terminal[0]) {
            let orders = room.memory.resources.terminal[0].orders.slice();
            orders.push(RESOURCE_ENERGY);
            let type = null;
            let amount = 0;
            for (var i=0;i<orders.length;i++) {
                type = orders[i].type;
                amount = terminal.getNeeds(type);
                if (amount > 0) {
                    // found a needed resource so check lower priority containers
                    if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, structureId: terminal.id, resourceType: type, needs: amount });
                    if (room.storage && room.storage.isActive() && room.storage.store[type] && !(type==RESOURCE_ENERGY && room.storage.charge < 0.5)) {
                        if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, targetStructureId: room.storage.id, resourceType: type, targetNeeds: room.storage.store[type] });
                        creep.data.reallocating = type;
                        return room.storage;
                    }
                }
            }
        }
    }
    return null;
};
action.newTargetStorage = function(creep) {
    let room = creep.room;
    // check storage for needs
    let storage = creep.room.storage;
    if (storage && storage.isActive()) {
        // check for excess to overflow back to terminal
        for (var resource in storage.store) {
            let amount = -storage.getNeeds(resource);
            if (resource && amount > 0) {
                if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, structureId: storage.id, resourceType: resource, needs: -amount });
                let dest = this.findNeeding(room, resource, 1, storage.id);
                if (dest) {
                    if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, targetStructureId: dest.structure.id, resourceType: resource, targetNeeds: dest.amount });
                    creep.data.reallocating = resource;
                    return storage;
                }
            }
        }
        // storage is lowest priority so has nowhere local to request resources from
    }
    return null;
};
action.isValidAction = function(creep){
    return true;
};
action.isValidTarget = function(target){
    return true;
};
action.isAddableAction = function(creep){
    let pop = creep.room.population;
    return (creep.sum == 0) && (!pop || !pop.actionCount[this.name] || pop.actionCount[this.name] < this.maxPerAction);
};
action.isAddableTarget = function(target){
    return true;
};
action.newTarget = function(creep){
    let room = creep.room;
    if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, subAction: 'newTarget' });
    let target = null;
    if( creep.sum == 0) {
        let data = room.memory;
        if (data) {
            target = this.newTargetLab(creep);
            if (target === null) target = this.newTargetPowerSpawn(creep);
            if (target === null) target = this.newTargetContainer(creep);
            if (target === null) target = this.newTargetTerminal(creep);
            if (target === null) target = this.newTargetStorage(creep);
        }
        return target;
    }
    else {
        // find destination for carried resource
        let resourceType = Object.keys(creep.carry)[0];
        let needing = this.findNeeding(room, resourceType);
        if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: room.name, creepName: creep.name, subAction: 'assignDropOff', targetStructureId: needing.structure.id, resourceType: resourceType, targetNeeds: needing.amount });
        return needing ? needing.structure : null;
    }
};
action.cancelAction = function(creep) {
    delete creep.data.actionName;
    delete creep.data.targetId;
    creep.action = null;
    creep.target = null;
    delete creep.data.path;
};
action.unloadStructure = function(creep, target, resource, amount) {
    var amt = Math.min(amount,creep.carryCapacity-creep.sum);
    let workResult = creep.withdraw(target, resource, amt);
    if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: creep.room.name, creepName: creep.name, subAction: 'unloadStructure', structureId: target.id, resourceType: resource, amount: amt, result: workResult });
    return workResult;
};
action.loadStructure = function(creep, target, resource, amount) {
    var workResult = null;
    let room = creep.room;
    var amt = Math.min(amount,creep.carry[resource]||0);
    if (amt > 0) workResult = creep.transfer(target, resource, amt);
    if (workResult == OK) {
        // update order
        let data = null;
        if (room.memory.resources) data = room.memory.resources[target.structureType].find((s)=>s.id==target.id);
        if (data && data.orders) {
            let order = data.orders.find(o=>o.type==resource);
            if (order && order.orderRemaining > 0) {
                order.orderRemaining -= amt;
            }
        }
    }
    if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: creep.room.name, creepName: creep.name, subAction: 'loadStructure', structureId: target.id, resourceType: resource, amount: amt, result: workResult });
    return workResult;
};
action.assignDropOff = function(creep, resource) {
    let data = this.findNeeding(creep.room, resource, 1, creep.target.id);
    if (data) {
        if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', roomName: creep.room.name, creepName: creep.name, subAction: 'assignDropOff', targetStructureId: data.structure.id, resourceType: resource, amount: data.amount });
        this.assign(creep, data.structure);
    }
    //delete creep.data.path;
};
action.unloadLab = function(creep) {
    // load up from the lab
    let target = creep.target;
    var workResult = null;
    var resource = null;
    var amount = 0;
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
    if (workResult == OK) {
        this.assignDropOff(creep, resource);
    } else this.cancelAction(creep);
    return workResult;
};
action.unloadPowerSpawn = function(creep) {
    let target = creep.target;
    var workResult = null;
    var resource = null;
    var amount = 0;
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
    if (workResult == OK) {
        this.assignDropOff(creep, resource);
    } else this.cancelAction(creep);
    return workResult;
};
action.unloadContainer = function(creep) {
    let target = creep.target;
    var workResult = null;
    var resource = null;
    var amount = 0;
    // identify resource and load up from store
    let store = Object.keys(target.store);
    if (creep.data.reallocating) {
        store.unshift(creep.data.reallocating);
        delete creep.data.reallocating;
    }
    for (let i=0;i<store.length;i++) {
        let res = store[i];
        if (res && target.store[res] > 0 && (target.structureType == STRUCTURE_LAB || target.getNeeds(res) < 0)) {
            let dat = this.findNeeding(room, res, 1, target.id);
            //if (dat && dat.structure.id == target.id) dat = null;
            if (dat) {
                amount = dat.amount;
            }
            //if (!amount) amount = -this.terminalNeeds(target, res);
            if (amount > 0) {
                resource = res;
                break;
            } else if (storage && storage.isActive() && dat && dat.structure.structureType == STRUCTURE_STORAGE && res == RESOURCE_ENERGY) {
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
    if (workResult == OK) {
        this.assignDropOff(creep, resource);
    } else this.cancelAction(creep);
    return workResult;
};
action.unloadTerminal = function(creep) {
    let target = creep.target;
    let room = creep.room;
    let storage = room.storage;
    var workResult = null;
    var resource = null;
    var amount = 0;
    // identify resource and load up from store
    let store = Object.keys(target.store);
    if (creep.data.reallocating) {
        store.unshift(creep.data.reallocating);
        delete creep.data.reallocating;
    }
    for (let i=0;i<store.length;i++) {
        let res = store[i];
        if (res && target.store[res] > 0 && (target.structureType == STRUCTURE_LAB || target.getNeeds(res) < 0)) {
            let dat = this.findNeeding(room, res, 1, target.id);
            //if (dat && dat.structure.id == target.id) dat = null;
            if (dat) {
                amount = dat.amount;
            }
            //if (!amount) amount = -this.terminalNeeds(target, res);
            if (amount > 0) {
                resource = res;
                break;
            } else if (storage && storage.isActive() && dat && dat.structure.structureType == STRUCTURE_STORAGE && res == RESOURCE_ENERGY) {
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
    if (workResult == OK) {
        this.assignDropOff(creep, resource);
    } else this.cancelAction(creep);
    return workResult;
};
action.unloadStorage = function(creep) {
    let target = creep.target;
    let room = creep.room;
    let terminal = room.terminal;
    var workResult = null;
    var resource = null;
    var amount = 0;
    // check for other container's needs and local excess
    let store = Object.keys(target.store);
    if (creep.data.reallocating) {
        store.unshift(creep.data.reallocating);
        delete creep.data.reallocating;
    }
    for (let i=0;i<store.length;i++) {
        let res = store[i];
        if (res && target.store[res] > 0) {
            if (res == RESOURCE_ENERGY && target.charge < 0.5) continue;
            let dat = this.findNeeding(room, res, 1, target.id);
            if (DEBUG && TRACE) trace('Action', { actionName: 'reallocating', subAction: 'findNeeding', roomName: room.name, creepName: creep.name, structureId: dat && dat.structure.id, resourceType: res, amount: dat && dat.amount });
            if (dat && dat.structure.id == target.id) dat = null;
            if (dat) {
                amount = dat.amount;
            }
            //if (!amount) amount = -this.storageNeeds(target, res);
            if (amount > 0) {
                resource = res;
                break;
            } else if (terminal && terminal.isActive() && dat && dat.structure.structureType == STRUCTURE_TERMINAL && res != RESOURCE_ENERGY && res != RESOURCE_POWER) {
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
    if (workResult == OK) {
        this.assignDropOff(creep, resource);
    } else this.cancelAction(creep);
    return workResult;
};
action.loadLab = function(creep) {
    let target = creep.target;
    let room = creep.room;
    var workResult = null;
    var resource = null;
    var amount = 0;
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
};
action.loadPowerSpawn = function(creep) {
    let target = creep.target;
    let room = creep.room;
    var workResult = null;
    var resource = null;
    var amount = 0;
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
};
action.loadContainer = function(creep) {
    let target = creep.target;
    let room = creep.room;
    var workResult = null;
    var resource = null;
    var amount = 0;
    // drop off at store
    for (var res in creep.carry) {
        if (res && creep.carry[res] == 0) continue;
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
};
action.loadTerminal = function(creep) {
    let target = creep.target;
    let room = creep.room;
    var workResult = null;
    var resource = null;
    var amount = 0;
    // drop off at store
    for (var res in creep.carry) {
        if (res && creep.carry[res] == 0) continue;
        amount = target.getNeeds(res);
        if (amount > 0) {
            resource = res;
            break;
        } else if (res != RESOURCE_ENERGY && res != RESOURCE_POWER) {
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
};
action.loadStorage = function(creep) {
    let target = creep.target;
    let room = creep.room;
    var workResult = null;
    var resource = null;
    var amount = 0;
    // drop off at store
    for (var res in creep.carry) {
        if (res && creep.carry[res] == 0) continue;
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
};
action.work = function(creep) {
    var workResult = null;
    let room = creep.room;
    let target = creep.target;
    let storage = room.storage;
    let terminal = room.terminal;

    if (creep.sum == 0) {
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