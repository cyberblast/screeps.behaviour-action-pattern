const mod = {};
module.exports = mod;
mod.analyzeRoom = function(room, needMemoryResync) {
    if (Game.time % global.PROCESS_ORDERS_INTERVAL === 0 || room.name === 'sim') {
        room.updateResourceOrders();
        room.updateRoomOrders();
        room.terminalBroker();
    }
};
mod.extend = function() {
    Room.prototype.updateResourceOrders = function () {
        let data = this.memory.resources;
        if (!this.my || !data) return;

        let rcl = this.controller.level;

        // go through reallacation orders and reset completed orders
        for(let structureType in data) {
            for(let i=0;i<data[structureType].length;i++) {
                let structure = data[structureType][i];
                // don't reset busy labs
                if (structureType == STRUCTURE_LAB && structure.reactionState != LAB_IDLE) continue;
                if (!structure.orders) continue;
                for(let j=0;j<structure.orders.length;j++) {
                    let order = structure.orders[j];
                    if (order.orderRemaining <= 0) {
                        let baseAmount = 0;
                        let rcl = this.controller.level;
                        if (structureType == STRUCTURE_STORAGE) baseAmount = (order.type == RESOURCE_ENERGY) ? MIN_STORAGE_ENERGY[rcl] : MAX_STORAGE_MINERAL;
                        else if (structureType == STRUCTURE_TERMINAL) baseAmount = (order.type == RESOURCE_ENERGY) ? TERMINAL_ENERGY : 0;
                        baseAmount += order.storeAmount;
                        let amount = 0;
                        let cont = Game.getObjectById(structure.id);
                        if (cont) {
                            switch (structureType) {
                                case STRUCTURE_LAB:
                                    // get lab amount
                                    if (order.type == cont.mineralType) {
                                        amount = cont.mineralAmount;
                                    } else if (order.type == RESOURCE_ENERGY) {
                                        amount = cont.energy;
                                    }
                                    break;
                                case STRUCTURE_POWER_SPAWN:
                                    // get power spawn amount
                                    if (order.type == RESOURCE_POWER) {
                                        amount = cont.power;
                                    } else if (order.type == RESOURCE_ENERGY) {
                                        amount = cont.energy;
                                    }
                                    break;
                                default:
                                    // get stored amount
                                    amount = cont.store[order.type] || 0;
                                    break;
                            }
                        }
                        if (amount <= baseAmount) {
                            order.orderAmount = 0;
                            order.orderRemaining = 0;
                        }
                    }
                }
            }
        }
    };

    Room.prototype.updateRoomOrders = function() {
        if (!this.memory.resources || !this.memory.resources.orders) return;
        let rooms = _.filter(Game.rooms, (room) => { return room.my && room.storage && room.terminal && room.name !== this.name; });
        let orders = this.memory.resources.orders;
        for (let i=0;i<orders.length;i++) {
            let order = orders[i];
            let amountRemaining = order.amount;
            for (let j=0;j<order.offers.length;j++) {
                let offer = order.offers[j];
                //if (amountRemaining > 0) {
                //    amountRemaining -= offer.amount;
                //} else {
                    if (Memory.rooms[offer.room] && Memory.rooms[offer.room].resources && Memory.rooms[offer.room].resources.offers) {
                        let remoteOffers = Memory.rooms[offer.room].resources.offers;
                        let idx = remoteOffers.indexOf((o)=>{ return o.room==this.name && o.id==order.id && o.type==order.type; });
                        if (idx !== -1) remoteOffers.splice(idx,1);
                    }
                //    order.offers.splice[j--,1];
                //}
            }
            order.offers = [];
            if (amountRemaining <= 0) {
                delete orders[i];
                orders.splice(i--,1);
                continue;
            } else {
                rooms.sort((a,b)=>{ return Game.map.getRoomLinearDistance(this.name,a.name,true) - Game.map.getRoomLinearDistance(this.name,b.name,true); });
                for (let j=0;j<rooms.length;j++) {
                    let room = rooms[j];
                    if (room.memory.resources === undefined) {
                        room.memory.resources = {
                            lab: [],
                            container: [],
                            terminal: [],
                            storage: [],
                            powerSpawn: [],
                        };
                    }
                    let available = (room.storage.store[order.type]||0) + (room.terminal.store[order.type]||0);
                    if (available < 100) continue;
                    available = Math.min(available,amountRemaining);
                    if (!room.memory.resources.offers) room.memory.resources.offers = [];
                    let existingOffer = order.offers.find((o)=>o.room==room.name);
                    let remoteOffers = room.memory.resources.offers;
                    let existingRemoteOffer = remoteOffers.find((o)=>{ return o.room==this.name && o.id==order.id && o.type==order.type; });
                    if (existingOffer) {
                        if (global.DEBUG && global.TRACE) trace("Room", { roomName: this.name, remoteRoom: room.name, actionName: 'updateRoomOrders', subAction: 'update', orderId: order.id, resourceType: order.type, amount: available })
                        amountRemaining -= (available - existingOffer.amount);
                        existingOffer.amount = available;
                    } else {
                        if (global.DEBUG && global.TRACE) trace("Room", { roomName: this.name, remoteRoom: room.name, actionName: 'updateRoomOrders', subAction: 'new', orderId: order.id, resourceType: order.type, amount: available })
                        if (global.DEBUG) logSystem(this.name, `Room offer from ${room.name} with id ${order.id} placed for ${available} ${order.type}.`);
                        amountRemaining -= available;
                        order.offers.push({
                            room: room.name,
                            amount: available
                        });
                    }
                    if (existingRemoteOffer) {
                        existingRemoteOffer.amount = available;
                    } else {
                        remoteOffers.push({
                            room: this.name,
                            id: order.id,
                            type: order.type,
                            amount: available
                        });
                    }
                    if (amountRemaining <= 0) break;
                }
            }
        }
    };

    Room.prototype.fillARoomOrder = function() {
        if (!(this.terminal && this.memory && this.memory.resources && this.memory.resources.offers)) return false;
        let offers = this.memory.resources.offers;
        for (let i=0;i<offers.length;i++) {
            let offer = offers[i];
            let targetRoom = Game.rooms[offer.room];
            if (!(targetRoom && targetRoom.memory && targetRoom.memory.resources && targetRoom.memory.resources.orders)) continue;
            let order = targetRoom.memory.resources.orders.find((o)=>{ return o.id==offer.id && o.type==offer.type; });
            if (!order) continue;
            let targetOfferIdx = order.offers.findIndex((o)=>{ return o.room==this.name; });
            if (targetOfferIdx == -1) {
                logSystem(this.name, "Orphaned offer found and deleted");
                offers.splice(i--,1);
                continue;
            }

            let store = this.terminal.store[offer.type]||0;
            let onOrder = 0;
            let terminalOrder = null;
            if (this.memory.resources.terminal[0]) terminalOrder = this.memory.resources.terminal[0].orders.find((o)=>{ return o.type==offer.type; });
            if (terminalOrder) onOrder = terminalOrder.orderRemaining;
            let amount = Math.max(offer.amount,100);
            if (amount > (store + onOrder)) {
                let amt = amount - (store + onOrder);
                if (global.DEBUG && global.TRACE) trace("Room", { actionName: 'fillARoomOrder', subAction: 'terminalOrder', roomName: this.name, targetRoomName: targetRoom.name, resourceType: offer.type, amount: amt });
                this.placeOrder(this.terminal.id, offer.type, amt);
            }
            if (!targetRoom.terminal) continue;
            let space = targetRoom.terminal.storeCapacity-targetRoom.terminal.sum;
            amount = Math.min(amount,space,store);

            let cost = Game.market.calcTransactionCost(amount, this.name, targetRoom.name);
            if (offer.type == RESOURCE_ENERGY) {
                amount -= cost;
                cost += amount;
            }
            if (cost > (this.terminal.store.energy||0)) continue;
            if (amount < 100) continue;

            let ret = this.terminal.send(offer.type,amount,targetRoom.name,order.id);
            if (ret == OK) {
                if (global.DEBUG && global.TRACE) trace("Room", { actionName: 'fillARoomOrder', roomName: this.name, targetRoomName: targetRoom.name, resourceType: offer.type, amount: amount });
                if (global.DEBUG) logSystem(this.name, `Room order filled to ${targetRoom.name} for ${amount} ${offer.type}.`);
                offer.amount -= amount;
                if (offer.amount > 0) {
                    order.offers[targetOfferIdx].amount = offer.amount;
                } else {
                    delete order.offers[targetOfferIdx];
                    order.offers.splice(targetOfferIdx,1);
                    delete offers[i];
                    offers.splice(i--,1);
                }
                order.amount -= amount;
                return true;
            }
        }

        return false;
    };

    Room.prototype.prepareResourceOrder = function(containerId, resourceType, amount) {
        let container = Game.getObjectById(containerId);
        if (!this.my || !container || !container.room.name == this.name ||
                !(container.structureType == STRUCTURE_LAB ||
                container.structureType == STRUCTURE_POWER_SPAWN ||
                container.structureType == STRUCTURE_CONTAINER ||
                container.structureType == STRUCTURE_STORAGE ||
                container.structureType == STRUCTURE_TERMINAL)) {
            return ERR_INVALID_TARGET;
        }
        if (!RESOURCES_ALL.includes(resourceType)) {
            return ERR_INVALID_ARGS;
        }
        if (this.memory.resources === undefined) {
            this.memory.resources = {
                lab: [],
                powerSpawn: [],
                container: [],
                terminal: [],
                storage: []
            };
        }
        if (this.memory.resources.powerSpawn === undefined) this.memory.resources.powerSpawn = [];
        if (!this.memory.resources[container.structureType].find( (s) => s.id == containerId )) {
            this.memory.resources[container.structureType].push(container.structureType==STRUCTURE_LAB ? {
                id: containerId,
                orders: [],
                reactionState: LAB_IDLE
            } : {
                id: containerId,
                orders: []
            });
        }
        if (container.structureType == STRUCTURE_LAB && resourceType != RESOURCE_ENERGY && amount > 0) {
            // clear other resource types since labs only hold one at a time
            let orders = this.memory.resources[STRUCTURE_LAB].find((s)=>s.id==containerId).orders;
            for (let i=0;i<orders.length;i++) {
                if (orders[i].type != resourceType && orders[i].type != RESOURCE_ENERGY) {
                    orders[i].orderAmount = 0;
                    orders[i].orderRemaining = 0;
                    orders[i].storeAmount = 0;
                }
            };
        }
        return OK;
    };

    Room.prototype.cancelOrder = function(containerId, resourceType = null) {
        let container = Game.getObjectById(containerId);
        if (this.prepareResourceOrder(containerId, RESOURCE_ENERGY, 0) != OK) return ret;

        let containerData = this.memory.resources[container.structureType].find( (s) => s.id == containerId );
        if ( containerData ) {
            if ( resourceType ) {
                let existingOrder = containerData.orders.find( (r) => r.type == resourceType );
                if ( existingOrder ) {
                    // delete structure order
                    if (global.DEBUG && global.TRACE) trace("Room", { roomName: this.name, actionName: 'cancelOrder', orderId: orderId, resourceType: resourceType })
                    containerData.orders.splice( containerData.orders.indexOf(existingOrder), 1 );
                }
            } else {
                // delete all of structure's orders
                if (global.DEBUG && global.TRACE) trace("Room", { roomName: this.name, actionName: 'cancelOrder', orderId: orderId, resourceType: 'all' })
                containerData.orders = [];
            }
        }
        return OK;
    };

    Room.prototype.placeOrder = function(containerId, resourceType, amount) {
        let container = Game.getObjectById(containerId);
        let ret = this.prepareResourceOrder(containerId, resourceType, amount);
        if (ret != OK) {
            return ret;
        }

        let containerData = this.memory.resources[container.structureType].find( (s) => s.id == containerId );
        if ( containerData ) {
            let existingOrder = containerData.orders.find( (r) => r.type == resourceType );
            if ( existingOrder ) {
                existingOrder.orderAmount += amount;
                existingOrder.orderRemaining += amount;
            } else {
                let containerStore = 0;
                if ( container.structureType === STRUCTURE_LAB ) {
                    containerStore = (container.mineralType==resourceType) ? container.mineralAmount : 0;
                } else {
                    containerStore = (container.store[resourceType]||0);
                }
                containerData.orders.push({
                    type: resourceType,
                    orderAmount: amount,
                    orderRemaining: amount - containerStore,
                    storeAmount: 0
                });
                if ( container.structureType === STRUCTURE_LAB ) {
                    containerData.reactionType = resourceType;
                }
            }
        }
        return OK;
    };

    Room.prototype.setStore = function(containerId, resourceType, amount) {
        let container = Game.getObjectById(containerId);
        let ret = this.prepareResourceOrder(containerId, resourceType, amount);
        if (ret != OK) {
            return ret;
        }

        let containerData = this.memory.resources[container.structureType].find( (s) => s.id == containerId );
        if ( containerData ) {
            let existingOrder = containerData.orders.find( (r) => r.type == resourceType );
            if ( existingOrder ) {
                existingOrder.storeAmount = amount;
            } else {
                containerData.orders.push({
                    type: resourceType,
                    orderAmount: 0,
                    orderRemaining: 0,
                    storeAmount: amount
                });
            }
        }
        return OK;
    };

    Room.prototype.cancelRoomOrder = function(orderId = null, resourceType = null) {
        if (this.memory.resources === undefined) {
            this.memory.resources = {
                lab: [],
                container: [],
                terminal: [],
                storage: []
            };
        }
        if (this.memory.resources.powerSpawn === undefined) this.memory.resources.powerSpawn = [];
        if (this.memory.resources.orders === undefined) {
            this.memory.resources.orders = [];
        }
        let orders = this.memory.resources.orders;
        if ( orderId && resourceType ) {
            let existingOrder = orders.find((o)=>{ return o.id==orderId && o.type==resourceType; });
            if (existingOrder) {
                // delete existing order
                if (global.DEBUG && global.TRACE) trace("Room", { roomName: this.name, actionName: 'cancelRoomOrder', orderId: orderId, resourceType: resourceType })
                orders.splice( orders.indexOf(existingOrder), 1 );
            }
        } else if ( orderId ) {
            // delete all orders matching orderId
            if (global.DEBUG && global.TRACE) trace("Room", { roomName: this.name, actionName: 'cancelRoomOrder', orderId: orderId, resourceType: 'all' })
            for (let i=0;i<orders.length;i++) {
                let order = orders[i];
                if ( order.id === orderId ) {
                    orders.splice( i--, 1 );
                }
            }
        } else {
            // delete all orders associated with this room
            this.memory.resources.orders = [];
        }

        return OK;
    };

    Room.prototype.placeRoomOrder = function(orderId, resourceType, amount) {
        if (amount <= 0) return OK;
        if (this.memory.resources === undefined) {
            this.memory.resources = {
                lab: [],
                container: [],
                terminal: [],
                storage: []
            };
        }
        if (this.memory.resources.powerSpawn === undefined) this.memory.resources.powerSpawn = [];
        if (this.memory.resources.orders === undefined) {
            this.memory.resources.orders = [];
        }
        let orders = this.memory.resources.orders;
        let existingOrder = orders.find((o)=>{ return o.id==orderId && o.type==resourceType; });
        if (existingOrder) {
            // update existing order
            if (global.DEBUG && global.TRACE) trace("Room", { roomName: this.name, actionName: 'placeRoomOrder', subAction: 'update', orderId: orderId, resourceType: resourceType, amount: amount })
            existingOrder.amount = amount;
        } else {
            // create new order
            if (global.DEBUG && global.TRACE) trace("Room", { roomName: this.name, actionName: 'placeRoomOrder', subAction: 'new', orderId: orderId, resourceType: resourceType, amount: amount })
            if (global.DEBUG) logSystem(this.name, `New room order with id ${orderId} placed for ${amount} ${resourceType}.`);
            orders.push({
                id: orderId,
                type: resourceType,
                amount: amount,
                offers: []
            });
        }

        return OK;
    };

    Room.prototype.terminalBroker = function() {
        if( !this.my || !this.terminal || !this.storage ) return;
        let that = this;
        let mineral = this.mineralType;
        let transacting = false;
        let terminalFull = (this.terminal.sum / this.terminal.storeCapacity) > 0.8;
        if( this.terminal.store[mineral] >= MIN_MINERAL_SELL_AMOUNT ) {
            let orders = Game.market.getAllOrders( o => {
                if( !o.roomName ||
                    o.resourceType != mineral ||
                    o.type != 'buy' ||
                    o.amount < MIN_MINERAL_SELL_AMOUNT ) return false;

                o.range = Game.map.getRoomLinearDistance(o.roomName, that.name, true);
                o.transactionAmount = Math.min(o.amount, that.terminal.store[mineral]);
                o.transactionCost = Game.market.calcTransactionCost(
                    o.transactionAmount,
                    that.name,
                    o.roomName);
                if(o.transactionCost > that.terminal.store.energy && o.transactionAmount > MIN_MINERAL_SELL_AMOUNT) {
                    // cant afford. try min amount
                    o.transactionAmount = MIN_MINERAL_SELL_AMOUNT;
                    o.transactionCost = Game.market.calcTransactionCost(
                        o.transactionAmount,
                        that.name,
                        o.roomName);
                }

                o.credits = o.transactionAmount*o.price;
                //o.ratio = o.credits/o.transactionCost; // old formula
                //o.ratio = (o.credits-o.transactionCost)/o.transactionAmount; // best offer assuming 1e == 1 credit
                //o.ratio = o.credits/(o.transactionAmount+o.transactionCost); // best offer assuming 1e == 1 mineral
                o.ratio = (o.credits - (o.transactionCost*ENERGY_VALUE_CREDITS)) / o.transactionAmount; // best offer assuming 1e == ENERGY_VALUE_CREDITS credits

                return (
                    (terminalFull || o.ratio >= MIN_SELL_RATIO[mineral]) &&
                    //o.range <= MAX_SELL_RANGE &&
                    o.transactionCost <= that.terminal.store.energy);
            });

            if( orders.length > 0 ){
                let order = _.max(orders, 'ratio');
                let result = Game.market.deal(order.id, order.transactionAmount, that.name);
                if( global.DEBUG || SELL_NOTIFICATION ) logSystem(that.name, `Selling ${order.transactionAmount} ${mineral} for ${order.credits} (${order.price} ¢/${mineral}, ${order.transactionCost} e): ${translateErrorCode(result)}`);
                if( SELL_NOTIFICATION ) Game.notify( `<h2>Room ${that.name} executed an order!</h2><br/>Result: ${translateErrorCode(result)}<br/>Details:<br/>${JSON.stringify(order).replace(',',',<br/>')}` );
                transacting = result == OK;
            }
        }
        if( this.controller.level == 8 && !transacting &&
            this.storage.charge > 0.8 &&
            (this.terminal.store[mineral]||0) < 150000 &&
            this.terminal.store.energy > 55000 ){
            let requiresEnergy = room => (
                room.my &&
                //room.controller.level < 8 &&
                room.storage && room.terminal &&
                room.terminal.sum < room.terminal.storeCapacity - 50000 &&
                room.storage.sum < room.storage.storeCapacity * 0.6 &&
                !room._isReceivingEnergy
            )
            let targetRoom = _.min(_.filter(Game.rooms, requiresEnergy), 'storage.store.energy');
            if( targetRoom instanceof Room && Game.market.calcTransactionCost(50000, this.name, targetRoom.name) < (this.terminal.store.energy-50000)) {
                targetRoom._isReceivingEnergy = true;
                let response = this.terminal.send('energy', 50000, targetRoom.name, 'have fun');
                if( global.DEBUG ) logSystem(that.name, `Transferring 50k energy to ${targetRoom.name}: ${translateErrorCode(response)}`);
                transacting = response == OK;
            }
        }
        if ( !transacting ) {
            transacting = this.fillARoomOrder();
        }
    };
};