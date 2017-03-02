let action = new Creep.Action('reallocating');
module.exports = action;
action.maxPerTarget = 1;
action.maxPerAction = 1;
// get<containerType>State functions return a positive value when they need filling, a negative value when they need emptying, and 0 when "close enough"
action.terminalNeeds = function(terminal, resourceType){
    var ret = 0;
    if (!terminal || !terminal.room.memory.resources) return 0;
    let terminalData = terminal.room.memory.resources.terminal[0];
    // look up resource and calculate needs
    let order = null;
    if (terminalData) order = terminalData.orders.find((o)=>{return o.type==resourceType;});
    if (!order) order = { orderAmount: 0, orderRemaining: 0, storeAmount: 0 };
    let loadTarget = order.orderRemaining + order.storeAmount + ((resourceType == RESOURCE_ENERGY) ? TERMINAL_ENERGY : 0);
    let unloadTarget = order.orderAmount + order.storeAmount + ((resourceType == RESOURCE_ENERGY) ? TERMINAL_ENERGY : 0);
    let store = terminal.store[resourceType]||0;
    if (store < loadTarget) ret = Math.min(loadTarget-store,terminal.storeCapacity-terminal.sum);
    else if (store > unloadTarget*1.05) ret = unloadTarget-store;
    return ret;
};
action.storageNeeds = function(storage, resourceType){
    var ret = 0;
    if (!storage || !storage.room.memory.resources) return 0;

    let storageData = storage.room.memory.resources.storage[0];
    // look up resource and calculate needs
    let order = null;
    if (storageData) order = storageData.orders.find((o)=>{return o.type==resourceType;});
    if (!order) order = { orderAmount: 0, orderRemaining: 0, storeAmount: 0 };
    let rcl = storage.room.controller.level;
    let loadTarget = order.orderRemaining + order.storeAmount + ((resourceType == RESOURCE_ENERGY) ? MIN_STORAGE_ENERGY[rcl] : MAX_STORAGE_MINERAL);
    // storage always wants energy
    let unloadTarget = (resourceType == RESOURCE_ENERGY) ? (storage.storeCapacity-storage.sum)+storage.store.energy : order.orderAmount + order.storeAmount + MAX_STORAGE_MINERAL;
    let store = storage.store[resourceType]||0;
    if (store < loadTarget) ret = Math.min(loadTarget-store,storage.storeCapacity-storage.sum);
    else if (store > unloadTarget*1.05) ret = unloadTarget-store;
    return ret;
};
action.containerNeeds = function(container, resourceType){
    if (!container || !container.room.memory.resources) return 0;

    // look up resource and calculate needs
    let containerData = container.room.memory.resources.container.find( (s) => s.id == container.id );
    if (containerData) {
        let order = containerData.orders.find((o)=>{return o.type==resourceType;});
        if (order) {
            let loadTarget = order.orderRemaining + order.storeAmount;
            let unloadTarget = order.orderAmount + order.storeAmount;
            let store = container.store[resourceType] || 0;
            if (store < loadTarget) return Math.min(loadTarget-store,container.storeCapacity-container.sum);
            if (store > unloadTarget*1.05) return unloadTarget-store;
        }
    }
    return 0;
};
action.labNeeds = function(lab, resourceType){
    if (!lab || !lab.room.memory.resources) return 0;
    let loadTarget = 0;
    let unloadTarget = 0;

    // look up resource and calculate needs
    let containerData = lab.room.memory.resources.lab.find( (s) => s.id == lab.id );
    if (containerData) {
        let order = containerData.orders.find((o)=>{return o.type==resourceType;});
        if (order) {
            loadTarget = order.orderRemaining + order.storeAmount;
            unloadTarget = order.orderAmount + order.storeAmount;
        }
    }
    let store = 0;
    let space = 0;
    if (resourceType == RESOURCE_ENERGY) {
        store = lab.energy;
        space = lab.energyCapacity-lab.energy;
    } else {
        store = lab.mineralType == resourceType ? lab.mineralAmount : 0;
        space = lab.mineralCapacity-lab.mineralAmount;
    }
    // lab requires precise loading
    if (store < loadTarget) return Math.min(loadTarget-store,space);
    if (store > unloadTarget) return unloadTarget-store;
    return 0;
};
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

    let data = room.memory;
    if (data) {
        if (data.labs && data.labs.length > 0) {
            for (var i=0;i<data.labs.length;i++) {
                let d = data.labs[i];
                let lab = Game.getObjectById(d.id);
                let amount = this.labNeeds(lab,resourceType);
                if (amount >= amountMin && (lab.mineralAmount == 0 || lab.mineralType == resourceType || resourceType == RESOURCE_ENERGY) && d.id != structureId)
                    return { structure: lab, amount: amount};
            }
        }
        if (data.container && data.container.length > 0) {
            for (var i=0;i<data.container.length;i++) {
                let d = data.container[i];
                let container = Game.getObjectById(d.id);
                let amount = this.containerNeeds(container,resourceType);
                if (amount >= amountMin && d.id != structureId) return { structure: container, amount: amount };
            }
        }
    }
    let terminal = room.terminal;
    if (terminal) {
        let amount = this.terminalNeeds(terminal,resourceType);
        if (amount >= amountMin && terminal.id != structureId) return { structure: terminal, amount: amount };
    }
    let storage = room.storage;
    if (storage) {
        let amount = this.storageNeeds(storage,resourceType);
        if (amount >= amountMin && storage.id != structureId) return { structure: storage, amount: amount };
    }

    // no specific needs found ... check for overflow availability
    if (storage && (resourceType == RESOURCE_ENERGY || resourceType == RESOURCE_POWER) && storage.storeCapacity-storage.sum > amountMin)
        return { structure: storage, amount: 0 };
    if (terminal && resourceType != RESOURCE_ENERGY && resourceType != RESOURCE_POWER && terminal.storeCapacity-terminal.sum > amountMin)
        return { structure: terminal, amount: 0 };

    // no destination found
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
    return creep.sum == 0 &&(!pop || !pop.actionCount[this.name] || pop.actionCount[this.name] < this.maxPerAction);
};
action.isAddableTarget = function(target){
    return true;
};
action.newTarget = function(creep){
    let room = creep.room;
    if (DEBUG_LOGISTICS) console.log(creep,"is looking for reallocation targets in", room.name);
    var target = null;
    if( creep.sum == 0) {
        let data = room.memory;
        if (data && data.labs) {
            // check labs for needs and make sure to empty the lab before filling
            if (data.labs.length > 0) {
                for (var i=0;i<data.labs.length;i++) {
                    let d = data.labs[i];
                    let lab = Game.getObjectById(d.id);
                    if (!lab) continue;
                    var amount = 0;
                    if (lab.mineralAmount > 0) {
                        amount = this.labNeeds(lab,lab.mineralType);
                        if (amount < 0) {
                            // lab has extra resource to be taken elsewhere
                            if (DEBUG_LOGISTICS) console.log(creep,lab,"has extra",lab.mineralType);
                            if (this.findNeeding(room,lab.mineralType)) return lab;
                        }
                        if (amount > 0) {
                            // lab needs more resource so find a lower priority container with some
                            if (DEBUG_LOGISTICS) console.log(creep,lab,"needs",amount,lab.mineralType);
                            if (room.storage.store[lab.mineralType]) return room.storage;
                            if (room.terminal.store[lab.mineralType]) return room.terminal;
                            let ret = room.findContainerWith(lab.mineralType);
                            if (ret) return ret.structure;
                            if (ROOM_TRADING && !(room.mineralType == RESOURCE_ENERGY || room.mineralType == lab.mineralType)) room.placeRoomOrder(lab.id,lab.mineralType,amount);
                        }
                    } else {
                        // lab is empty so check and fill order
                        let order = this.getLabOrder(lab);
                        let resourceType = null;
                        if (order) {
                            // found an order
                            resourceType = order.type;
                            if (DEBUG_LOGISTICS) console.log(creep,lab,"needs",order.orderRemaining+order.storeAmount,resourceType);
                            if (room.storage.store[resourceType]) return room.storage;
                            if (room.terminal.store[resourceType]) return room.terminal;
                            let ret = room.findContainerWith(resourceType);
                            if (ret) return ret.structure;
                            if (ROOM_TRADING && !(room.mineralType == RESOURCE_ENERGY || room.mineralType == resourceType)) room.placeRoomOrder(lab.id,resourceType,order.orderRemaining);
                        }
                    }
                    amount = this.labNeeds(lab,RESOURCE_ENERGY);
                    if (amount < 0) {
                        // lab has extra energy (I guess ...)
                        if (DEBUG_LOGISTICS) console.log(creep,lab,"has extra energy");
                        if (this.findNeeding(room, RESOURCE_ENERGY)) return lab;
                    }
                    if (amount > 0) {
                        // lab needs energy so find a lower priority container with some
                        if (DEBUG_LOGISTICS) console.log(creep,lab,"needs",amount,RESOURCE_ENERGY);
                        if (room.storage.store[RESOURCE_ENERGY]) return room.storage;
                        if (room.terminal.store[RESOURCE_ENERGY]) return room.terminal;
                        let ret = room.findContainerWith(RESOURCE_ENERGY);
                        if (ret) return ret.structure;
                    }
                }
              }

            // check containers for needs
            if (data.container.length > 0) {
                for (var i=0;i<data.container.length;i++) {
                    let d = data.container[i];
                    let container = Game.getObjectById(d.id);
                    if (container) {
                        // check contents for excess
                        for(var resource in container.store) {
                            if (resource && this.containerNeeds(container,resource) < 0) {
                                // container has extra resource
                                if (DEBUG_LOGISTICS) console.log(creep,container,"has extra",resource);
                                if (this.findNeeding(room, resource)) return container;
                            }
                        }
                        // check orders for needs
                        if (room.memory.resources) {
                            let containerData = room.memory.resources.container.find( (s) => s.id == d.id );
                            if (containerData) {
                                let orders = containerData.orders;
                                for (var j=0;j<orders.length;j++) {
                                    let type = orders[j].type;
                                    let amount = this.containerNeeds(container,type);
                                    if (amount > 0) {
                                        // found a needed resource so check lower priority containers
                                        if (DEBUG_LOGISTICS) console.log(creep,container,"needs",amount,type);
                                        if (room.storage && room.storage.store[type]) return room.storage;
                                        if (room.terminal && room.terminal.store[type]) return room.terminal;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            // check terminal for needs
            let terminal = creep.room.terminal;
            if (terminal) {
                // check for excess
                for (var resource in terminal.store) {
                    // terminal only has too much energy or power
//                    if (resource && (resource == RESOURCE_ENERGY || resource == RESOURCE_POWER)) {
                        let amount = -this.terminalNeeds(terminal,resource);
                        if (amount > 0) {
                            // excess resource found
                            if (DEBUG_LOGISTICS) console.log(creep,terminal,"has",amount,"extra",resource);
                            let dest = this.findNeeding(room, resource, 1, terminal.id);
                            if (dest && dest.structure.id != terminal.id) {
                                if (DEBUG_LOGISTICS) console.log(creep,"found destination",dest.structure)
                                return terminal;
                            }
                        }
//                    }
                };
                // check orders
                if (room.memory.resources && room.memory.resources.terminal[0]) {
                    let orders = room.memory.resources.terminal[0].orders;
                    let type = null;
                    let amount = 0;
                    for (var i=0;i<orders.length;i++) {
                        type = orders[i].type;
                        amount = this.terminalNeeds(terminal,type);
                        if (amount > 0) break;
                    }
                    if (amount == 0) {
                        type = RESOURCE_ENERGY;
                        amount = this.terminalNeeds(terminal,type);
                    }
                    if (amount > 0) {
                        // found a needed resource so check lower priority containers
                        if (DEBUG_LOGISTICS) console.log(creep,terminal,"needs",amount,type);
                        if (room.storage.store[type]) return room.storage;
                    }
                }
            }
            // check storage for needs
            let storage = creep.room.storage;
            if (storage) {
                // check for excess to overflow back to terminal
                for (var resource in storage.store) {
                    let amount = -this.storageNeeds(storage,resource);
                    if (resource && amount > 0) {
                        if (DEBUG_LOGISTICS) console.log(creep,storage,"has",amount,"extra",resource);
                        let dest = this.findNeeding(room, resource, 1, storage.id);
                        if (DEBUG_LOGISTICS) console.log(creep,"found destination",dest.structure)
                        if (dest) return storage;
                    }
                };
                // storage is lowest priority so has nowhere local to request resources from
            }
        }
        return target;
    }
    else {
        // find destination for carried resource
        let resourceType = Object.keys(creep.carry)[0];
        return Game.getObjectById(this.findNeeding(room, resourceType).structureId);
    }
};
action.isValidStructureType = function(target) {
    let type = target.structureType;
    return type == STRUCTURE_STORAGE || type == STRUCTURE_TERMINAL || type == STRUCTURE_CONTAINER || type == STRUCTURE_LAB;
};
action.cancelAction = function(creep) {
    delete creep.data.actionName;
    delete creep.data.targetId;
    creep.action = null;
    creep.target = null;
    delete creep.data.path;
};
action.loadResource = function(creep, target, resource, amount) {
    let room = creep.room;
    let workResult = creep.withdraw(target, resource, Math.min(amount,creep.carryCapacity-creep.sum));
    return workResult;
};
action.assignDropOff = function(creep, resource) {
    let data = this.findNeeding(creep.room, resource);
    if (data) {
        this.assign(creep, data.structure);
    }
    delete creep.data.path;
};
action.work = function(creep) {
    let target = creep.target;
    let type = target.structureType;
    let room = creep.room;
    let storage = room.storage;
    let terminal = room.terminal;
    var workResult = null;
    var resource = null;
    var amount = 0;

    if (creep.sum == 0 && type == STRUCTURE_LAB) {
        // load up from the lab
        amount = -this.labNeeds(target, RESOURCE_ENERGY);
        if (amount > 0) resource = RESOURCE_ENERGY;
        if (!resource) {
            amount = -this.labNeeds(target, target.mineralType)
            if (amount > 0) resource = target.mineralType;
        }
        if (resource) {
            workResult = this.loadResource(creep, target, resource, amount);
            this.assignDropOff(creep, resource);
        } else this.cancelAction(creep);
    } else if (creep.sum == 0 && type == STRUCTURE_CONTAINER) {
        // identify resource and load up from store
        for (var res in target.store) {
            amount = -this.containerNeeds(target, res);
            if (amount > 0) { resource = res; break; }
        }
        if (resource) {
            workResult = this.loadResource(creep, target, resource, amount);
            this.assignDropOff(creep, resource);
        } else this.cancelAction(creep);
    } else if (creep.sum == 0 && type == STRUCTURE_TERMINAL) {
        // identify resource and load up from store
        for (var res in target.store) {
            if (res) {
                let dat = this.findNeeding(room, res);
                if (dat && dat.structure.id == target.id) dat = null;
                if (dat) {
                    if (DEBUG_LOGISTICS) console.log(creep,target,"found need for",dat.amount,res,"in",dat.structure);
                    amount = dat.amount;
                }
                //if (!amount) amount = -this.terminalNeeds(target, res);
                if (amount > 0) {
                    resource = res;
                    break;
                } else if (storage && dat && dat.structure.structureType == STRUCTURE_STORAGE && res == RESOURCE_ENERGY) {
                    amount = storage.storeCapacity-storage.sum;
                    resource = res;
                    break;
                }
            }
        }
        if (resource) {
            amount = Math.min(amount,target.store[resource]||0,creep.carryCapacity-creep.sum);
            if (DEBUG_LOGISTICS) console.log(creep,"picking up", amount, resource, "from terminal");
            workResult = this.loadResource(creep, target, resource, amount);
            this.assignDropOff(creep, resource);
        } else this.cancelAction(creep);
    } else if (creep.sum == 0 && type == STRUCTURE_STORAGE) {
        // check for other container's needs and local excess
        for (var res in target.store) {
            if (res) {
                let dat = this.findNeeding(room, res);
                if (dat && dat.structure.id == target.id) dat = null;
                if (dat) {
                    if (DEBUG_LOGISTICS) console.log(creep,target,"found need for",dat.amount,res,"in",dat.structure);
                    amount = dat.amount;
                }
                //if (!amount) amount = -this.storageNeeds(target, res);
                if (amount > 0) {
                    resource = res;
                    break;
                } else if (terminal && dat && dat.structure.structureType == STRUCTURE_TERMINAL && res != RESOURCE_ENERGY && res != RESOURCE_POWER) {
                    amount = terminal.storeCapacity-terminal.sum;
                    resource = res;
                    break;
                }
            }
        }
        if (resource) {
            amount = Math.min(amount,target.store[resource]||0,creep.carryCapacity-creep.sum);
            if (DEBUG_LOGISTICS) console.log(creep,"picking up", amount, resource, "from storage");
            workResult = this.loadResource(creep, target, resource, amount);
            this.assignDropOff(creep, resource);
        } else this.cancelAction(creep);
    } else if (type == STRUCTURE_LAB) {
        // drop off at lab
        amount = this.labNeeds(target, RESOURCE_ENERGY);
        if (amount > 0 && (creep.carry.energy||0) > 0) {
            resource = RESOURCE_ENERGY;
        } else {
            let order = this.getLabOrder(target);
            if (order) resource = order.type;
            amount = this.labNeeds(target, resource);
            if (!(amount > 0 && (creep.carry[resource]||0) > 0)) {
                resource = null;
            }
        }
        amount = Math.min(amount,creep.carry[resource]||0);
        if (resource) workResult = creep.transfer(target, resource, amount);

        if ((creep.carry[resource]||0) > amount) {
            this.assignDropOff(creep, resource);
        } else {
            this.cancelAction(creep);
        }
    } else if (type == STRUCTURE_CONTAINER) {
        // drop off at store
        for (var res in creep.carry) {
            amount = this.containerNeeds(target, res);
            if (amount > 0) {
                resource = res;
                break;
            }
        }
        amount = Math.min(amount,creep.carry[resource]||0);
        if (resource) workResult = creep.transfer(target, resource, amount);

        if ((creep.carry[resource]||0) > amount) {
            this.assignDropOff(creep, resource);
        } else {
            this.cancelAction(creep);
        }
    } else if (type == STRUCTURE_TERMINAL) {
        // drop off at store
        for (var res in creep.carry) {
            amount = this.terminalNeeds(target, res);
            if (amount > 0) {
                resource = res;
                break;
            } else if (res != RESOURCE_ENERGY && res != RESOURCE_POWER) {
                resource = res;
                amount = target.storeCapacity-target.sum;
                break;
            }
        }
        amount = Math.min(amount,creep.carry[resource]||0);
        if (resource) workResult = creep.transfer(target, resource, amount);

        if ((creep.carry[resource]||0) > amount) {
            this.assignDropOff(creep, resource);
        } else {
            this.cancelAction(creep);
        }
    } else if (type == STRUCTURE_STORAGE) {
        // drop off at store
        for (var res in creep.carry) {
            amount = this.storageNeeds(target, res);
            if (amount > 0) {
                resource = res;
                break;
            }
        }
        amount = Math.min(amount,creep.carry[resource]||0);
        if (resource) workResult = creep.transfer(target, resource, amount);

        if ((creep.carry[resource]||0) > amount) {
            this.assignDropOff(creep, resource);
        } else {
            this.cancelAction(creep);
        }
    } else {
        this.cancelAction(creep);
    }
    if (workResult == OK && creep.sum > 0) {
        // update order
        let data = null;
        if (room.memory.resources) data = room.memory.resources[target.structureType].find((s)=>s.id==target.id);
        if (data) {
            let order = data.orders.find(o=>o.type==resource);
            if (order && order.orderRemaining > 0) {
                order.orderRemaining -= amount;
            }
        }
    }
    return workResult;
};
action.onAssignment = function(creep, target) {
    if( SAY_ASSIGNMENT ) creep.say(String.fromCharCode(8660), SAY_PUBLIC);
};
