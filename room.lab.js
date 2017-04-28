const mod = {};
module.exports = mod;
mod.analyzeRoom = function(room, needMemoryResync) {
    if (needMemoryResync) {
        room.saveLabs();
    }
    if (room.structures.labs.all.length > 0) room.processLabs();
};
mod.extend = function() {
    // Labs constructor
    Room.Labs = function(room){
        this.room = room;
        Object.defineProperties(this, {
            'all': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._all) ){
                        this._all = [];
                        let add = entry => {
                            let o = Game.getObjectById(entry.id);
                            if( o ) {
                                _.assign(o, entry);
                                this._all.push(o);
                            }
                        };
                        _.forEach(this.room.memory.labs, add);
                    }
                    return this._all;
                }
            },
            'storage': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._storage) ) {
                        let byType = l => l.storage === true;
                        this._storage = this.all.filter(byType);
                    }
                    return this._storage;
                }
            }
        });
    };
    // Lab related Room variables go here

    // Room prototype extensions go here
    Room.prototype.saveLabs = function(){
        let labs = this.find(FIND_MY_STRUCTURES, {
            filter: (structure) => ( structure.structureType == STRUCTURE_LAB )
        });
        if (labs.length > 0) {
            this.memory.labs = [];
            let storageLabs = this.storage ? this.storage.pos.findInRange(labs, 2).map(l => l.id) : [];

            this.memory.labs = [];

            // for each entry add to memory ( if not contained )
            let add = (lab) => {
                let labData = this.memory.labs.find( (l) => l.id == lab.id );
                if( !labData ) {
                    this.memory.labs.push({
                        id: lab.id,
                        storage: storageLabs.includes(lab.id),
                    });
                }
            };
            labs.forEach(add);
        } else delete this.memory.labs;
    };

    Room.prototype.processLabs = function() {
        // only process labs every 10 turns and avoid room tick
        if (Game.time % LAB_COOLDOWN !== 5) return;
        let labs = this.find(FIND_MY_STRUCTURES, { filter: (s) => { return s.structureType == STRUCTURE_LAB; } } );
        if (!this.memory.resources) return;
        // run basic reactions
        let master_labs = labs.filter( (l) => {
            let data = this.memory.resources.lab.find( (s) => s.id == l.id );
            return data ? (data.slave_a && data.slave_b) : false;
        } );
        for (let i=0;i<master_labs.length;i++) {
            // see if the reaction is possible
            let master = master_labs[i];
            if (master.cooldown > 0) continue;
            let data = this.memory.resources.lab.find( (s) => s.id == master.id );
            if (!data) continue;
            let compound = data.reactionType;
            if (master.mineralAmount > 0 && master.mineralType != compound) continue;
            let slave_a = Game.getObjectById(data.slave_a);
            let slave_b = Game.getObjectById(data.slave_b);
            if (!slave_a || slave_a.mineralType != LAB_REACTIONS[compound][0] || !slave_b || slave_b.mineralType != LAB_REACTIONS[compound][1]) continue;

            if (master.runReaction(slave_a, slave_b) == OK) {
                data.reactionAmount -= LAB_REACTION_AMOUNT;
                if( global.DEBUG && global.TRACE ) trace("Room", { roomName: this.name, actionName: "processLabs", labId: master.id, resourceType: compound, amountRemaining: data.reactionAmount } );
                if (data.reactionAmount <= 0) {
                    this.cancelReactionOrder(master.id);
                }
            }
        }

        // run reactors
        let data = this.memory.resources.reactions;
        if ( !data ) return;
        switch ( data.reactorType ) {
            case REACTOR_TYPE_FLOWER:
                this.processReactorFlower();
                break;
            default:
                break;
        }
    };

    Room.prototype.processReactorFlower = function() {
        let data = this.memory.resources.reactions;
        if ( !data || data.reactorType !== REACTOR_TYPE_FLOWER ) return;

        // find and qualify reaction order
        for (let i=0;i<data.orders.length;i++) {
            if (data.orders[i].amount < LAB_REACTION_AMOUNT ) {
                data.orders.splice( i--, 1 );
            } else {
                break;
            }
        }
        if ( data.orders.length === 0 ) {
            // reset labs so they get emptied
            let labs = this.find(FIND_MY_STRUCTURES, { filter: (s) => { return s.structureType == STRUCTURE_LAB; } } );
            for (let i=0;i<labs.length;i++) {
                let lab = labs[i];
                let data = this.memory.resources.lab.find( s => s.id === lab.id );
                if ( data && ( data.reactionState === LAB_IDLE || data.reactionState === LAB_SEED ) ) {
                    this.cancelReactionOrder(lab.id);
                }
            }
            data.reactorMode = REACTOR_MODE_IDLE;
            return;
        }
        let order = data.orders[0];
        data.reactorMode = order.mode;

        switch ( data.reactorMode ) {
            case REACTOR_MODE_BURST:
                this.processReactorFlowerBurst();
                break;
            default:
                break;
        }
    };

    Room.prototype.processReactorFlowerBurst = function() {
        let data = this.memory.resources.reactions;
        if ( !data || data.reactorType !== REACTOR_TYPE_FLOWER || data.reactorMode !== REACTOR_MODE_BURST ) return;

        let order = data.orders[0];
        if ( order.mode !== REACTOR_MODE_BURST ) return;
        let component_a = LAB_REACTIONS[order.type][0];
        let component_b = LAB_REACTIONS[order.type][1];
        let seed_a = Game.getObjectById(data.seed_a);
        let seed_b = Game.getObjectById(data.seed_b);
        if ( !seed_a || !seed_b ) return;

        // order components for seeds
        let data_a = this.memory.resources.lab.find( l => l.id === data.seed_a );
        let data_b = this.memory.resources.lab.find( l => l.id === data.seed_b );
        if ( !data_a || data_a.reactionType !== component_a ) {
            this.placeOrder(data.seed_a, component_a, order.amount);
            data_a = this.memory.resources.lab.find( l => l.id === data.seed_a );
            data_a.reactionType = component_a;
        }
        if ( !data_b || data_b.reactionType !== component_b ) {
            this.placeOrder(data.seed_b, component_b, order.amount);
            data_b = this.memory.resources.lab.find( l => l.id === data.seed_b );
            data_b.reactionType = component_b;
        }
        if ( !data_a || !data_b ) return;
        let data_a_order = data_a.orders.find( o => o.type === component_a );
        let data_b_order = data_b.orders.find( o => o.type === component_b );
        if ( !data_a_order || data_a_order.amount < order.amount ) {
            this.placeOrder(data.seed_a, component_a, order.amount - ( data_a_order ? data_a_order.orderAmount : 0 ) );
        }
        if ( !data_b_order || data_b_order.amount < order.amount ) {
            this.placeOrder(data.seed_b, component_b, order.amount - ( data_b_order ? data_b_order.orderAmount : 0 ) );
        }

        // find and configure idle labs
        let labs = this.find(FIND_MY_STRUCTURES, { filter: (s) => { return s.structureType == STRUCTURE_LAB; } } );
        let reactors = labs.filter ( l => {
            let data = this.memory.resources.lab.find( s => s.id === l.id );
            return data ? data.reactionState === LAB_IDLE : true;
        } );
        for (let i=0;i<reactors.length;i++) {
            let reactor = reactors[i];
            let data = this.memory.resources.lab.find( s => s.id === reactor.id );
            if ( !data ) {
                this.prepareReactionOrder(reactor.id, order.type, order.amount);
                data = this.memory.resources.lab.find( s => s.id === reactor.id );
            }
            if ( data ) data.reactionType = order.type;
        }

        // verify ability to run reactor
        if ( seed_a.mineralType !== component_a || seed_b.mineralType !== component_b ) return;
        let maxReactions = Math.floor( Math.min( seed_a.mineralAmount, seed_b.mineralAmount, order.amount ) / LAB_REACTION_AMOUNT );
        if ( maxReactions === 0 ) return;

        // run reactions
        let burstReactors = 0;
        for (let i=0;i<reactors.length;i++) {
            let reactor = reactors[i];
            if ( reactor.mineralAmount === 0 || ( reactor.mineralType === order.type && reactor.mineralAmount <= reactor.mineralCapacity - LAB_REACTION_AMOUNT && burstReactors < maxReactions ) ) {
                burstReactors++;
                // FU - SION - HA !
                if ( reactor.runReaction( seed_a, seed_b ) === OK ) {
                    order.amount -= LAB_REACTION_AMOUNT;
                    if( global.DEBUG && global.TRACE ) trace("Room", { roomName: this.name, actionName: "processLabs", reactorType: REACTOR_TYPE_FLOWER, labId: reactor.id, resourceType: order.type, amountRemaining: order.amount } );
                }
            }
        }
    };

    Room.prototype.cancelReactionOrder = function(labId, dataFilter) {
        let labData = this.memory.resources.lab.find( (l) => l.id == labId );
        if ( dataFilter && !_.matches(dataFilter)(labId)) return;

        if ( labData ) {
            // clear slave reaction orders
            if (labData.slave_a) this.cancelReactionOrder(labData.slave_a, {master: labId});
            if (labData.slave_b) this.cancelReactionOrder(labData.slave_b, {master: labId});

            // clear reaction orders
            let basicStates = [ LAB_MASTER, LAB_SLAVE_1, LAB_SLAVE_2, LAB_SLAVE_3 ];
            if ( basicStates.includes(labData.reactionState) ) labData.reactionState = LAB_IDLE;
            delete labData.reactionType;
            delete labData.reactionAmount;
            delete labData.master;
            delete labData.slave_a;
            delete labData.slave_b;

            if (this.memory.resources === undefined) {
                this.memory.resources = {
                    lab: [],
                    container: [],
                    terminal: [],
                    storage: []
                };
            }
            if (this.memory.resources.orders === undefined) {
                this.memory.resources.orders = [];
            }

            let orders = this.memory.resources.orders;
            // clear local resource orders
            for (let i=0;i<labData.orders.length;i++) {
                let order = labData.orders[i];
                if (order.type == RESOURCE_ENERGY) continue;
                order.orderAmount = 0;
                order.orderRemaining = 0;
                order.storeAmount = 0;
            }
        }

        return OK;
    };

    Room.prototype.prepareReactionOrder = function(labId, resourceType, amount) {
        if (amount <= 0) return OK;
        let lab = Game.getObjectById(labId);
        if (!this.my || !lab || !lab.structureType == STRUCTURE_LAB) return ERR_INVALID_TARGET;
        if (!LAB_REACTIONS.hasOwnProperty(resourceType)) {
            return ERR_INVALID_ARGS;
        }
        if (this.memory.resources === undefined) {
            this.memory.resources = {
                lab: [],
                container: [],
                terminal: [],
                storage: []
            };
        }

        let labData = this.memory.resources.lab.find( (l) => l.id == labId );
        if ( !labData ) {
            this.memory.resources.lab.push({
                id: labId,
                orders: [],
                reactionState: LAB_IDLE
            });
            labData = this.memory.resources.lab.find( (l) => l.id == labId );
        }

        this.cancelReactionOrder(labId);

        return OK;
    };

    Room.prototype.placeBasicReactionOrder = function(labId, resourceType, amount, tier = 1) {
        if (amount <= 0) return OK;
        if (!LAB_REACTIONS.hasOwnProperty(resourceType)) {
            return ERR_INVALID_ARGS;
        }
        if (this.memory.resources === undefined) {
            this.memory.resources = {
                lab: [],
                container: [],
                terminal: [],
                storage: []
            };
        }
        if (this.memory.resources.powerSpawn === undefined) this.memory.resources.powerSpawn = [];
        let lab_master = Game.getObjectById(labId);
        let component_a = LAB_REACTIONS[resourceType][0];
        let component_b = LAB_REACTIONS[resourceType][1];
        let lab_slave_a = null;
        let lab_slave_b = null;

        // find slave labs
        let nearbyLabs = lab_master.pos.findInRange(FIND_MY_STRUCTURES, 2, {filter: (s)=>{ return s.structureType==STRUCTURE_LAB && s.id != lab_master.id; }});
        //console.log(lab_master,"found",nearbyLabs.length,"potential slave labs");
        for (let i=0;i<nearbyLabs.length;i++) {
            let lab = nearbyLabs[i];
            let data = this.memory.resources.lab.find( (l) => l.id == lab.id );
            //console.log(lab_master,"potential slave",i,"has",lab.mineralType,"and is currently",data?data.reactionState:"idle");
            if (lab_slave_a == null && data && data.reactionType == component_a) {
                lab_slave_a = lab;
            } else if (lab_slave_b == null && data && data.reactionType == component_b) {
                lab_slave_b = lab;
            }
            if (lab_slave_a && lab_slave_b) break;
        }
        if (!lab_slave_a || !lab_slave_b) {
            nearbyLabs.sort( (a,b) => lab_master.pos.getRangeTo(a) - lab_master.pos.getRangeTo(b));
            for (let i=0;i<nearbyLabs.length;i++) {
                let lab = nearbyLabs[i];
                let data = this.memory.resources.lab.find( (l) => l.id == lab.id );
                if (!data || !data.reactionState || data.reactionState == LAB_IDLE) {
                    if (lab_slave_a == null) lab_slave_a = lab;
                    else if (lab_slave_b == null) lab_slave_b = lab;
                }
            }
        }

        // qualify labs and prepare states
        if (lab_slave_a == null || lab_slave_b == null) return ERR_NOT_FOUND;
        let ret = this.prepareReactionOrder(labId, resourceType, amount);
        if (ret != OK) {
            return ret;
        }
        ret = this.prepareReactionOrder(lab_slave_a.id, resourceType, amount);
        if (ret != OK) {
            return ret;
        }
        ret = this.prepareReactionOrder(lab_slave_b.id, resourceType, amount);
        if (ret != OK) {
            return ret;
        }

        // place reaction order with master lab
        let labData = this.memory.resources.lab.find( (l) => l.id == labId );
        let state = LAB_MASTER;
        if ( labData ) {
            if (labData.reactionState == LAB_SLAVE_1) state = LAB_SLAVE_1;
            if (labData.reactionState == LAB_SLAVE_2) state = LAB_SLAVE_2;
            labData.reactionState = state;
            labData.reactionType = resourceType;
            labData.reactionAmount = amount;
            labData.slave_a = lab_slave_a.id;
            labData.slave_b = lab_slave_b.id;
        }

        // place orders with slave labs
        labData = this.memory.resources.lab.find( (l) => l.id == lab_slave_a.id );
        let slaveState = LAB_SLAVE_1;
        let slaveDepth = 1;
        if (state == LAB_SLAVE_1) {
            slaveState = LAB_SLAVE_2;
            slaveDepth = 2;
        } else if (state == LAB_SLAVE_2) {
            slaveState = LAB_SLAVE_3;
            slaveDepth = 3;
        }
        if ( labData ) {
            labData.reactionState = slaveState;
            labData.reactionType = component_a;
            labData.master = lab_master.id;
            this.placeOrder(lab_slave_a.id, component_a, amount);

            let available = 0;
            if (this.memory.container) {
                for (let i=0;i<this.memory.container.length;i++) {
                    let d = this.memory.container[i];
                    let container = Game.getObjectById(d.id);
                    if (container && container.store[component_a]) {
                        available += container.store[component_a];
                    }
                }
            }
            if (this.storage) available += this.storage.store[component_a]||0;
            if (this.terminal) available += this.terminal.store[component_a]||0;
            if (tier > slaveDepth && slaveDepth < 3 && available < amount) {
                if (this.placeReactionOrder(lab_slave_a.id,component_a,amount-available) == OK) {
                    let order = labData.orders.find((o)=>o.type==component_a);
                    if (order) order.orderRemaining = available;
                }
            }
        }
        labData = this.memory.resources.lab.find( (l) => l.id == lab_slave_b.id );
        if ( labData ) {
            labData.reactionState = slaveState;
            labData.reactionType = component_b;
            labData.master = lab_master.id;
            this.placeOrder(lab_slave_b.id, component_b, amount);

            let available = 0;
            if (this.memory.container) {
                for (let i=0;i<this.memory.container.length;i++) {
                    let d = this.memory.container[i];
                    let container = Game.getObjectById(d.id);
                    if (container) {
                        available += container.store[component_b]||0;
                    }
                }
            }
            if (this.storage) available += this.storage.store[component_b]||0;
            if (this.terminal) available += this.terminal.store[component_b]||0;
            if (tier > slaveDepth && slaveDepth < 3 && available < amount) {
                if (this.placeReactionOrder(lab_slave_a.id,component_a,amount-available) == OK) {
                    let order = labData.orders.find((o)=>o.type==component_b);
                    if (order) order.orderRemaining = available;
                }
            }
        }

        //console.log(lab_master,"found slave labs",lab_slave_a,"for",component_a,"and",lab_slave_b,"for",component_b);
        return OK;
    };

    Room.prototype.placeFlowerReactionOrder = function(orderId, resourceType, amount, mode = REACTOR_MODE_BURST) {
        if (amount <= 0) return OK;
        if (!LAB_REACTIONS.hasOwnProperty(resourceType)) {
            return ERR_INVALID_ARGS;
        }
        if (this.memory.resources === undefined) {
            this.memory.resources = {
                lab: [],
                container: [],
                terminal: [],
                storage: []
            };
        }
        if (this.memory.resources.powerSpawn === undefined) this.memory.resources.powerSpawn = [];

        let data = this.memory.resources;
        if ( data.reactions ) {
            // create reaction order
            let existingOrder = data.reactions.orders.find((o)=>{ return o.id==orderId && o.type==resourceType; });
            if ( existingOrder ) {
                // update existing order
                if (global.DEBUG && global.TRACE) trace("Room", { roomName: this.name, actionName: 'placeReactionOrder', subAction: 'update', orderId: orderId, resourceType: resourceType, amount: amount })
                existingOrder.mode = mode;
                existingOrder.amount = amount;
            } else {
                // create new order
                if (global.DEBUG && global.TRACE) trace("Room", { roomName: this.name, actionName: 'placeReactionOrder', subAction: 'new', orderId: orderId, resourceType: resourceType, amount: amount })
                data.reactions.orders.push({
                    id: orderId,
                    type: resourceType,
                    mode: mode,
                    amount: amount,
                });
            }
            data.reactions.reactorMode = mode;
        }

        return OK;
    };

    Room.prototype.placeReactionOrder = function(orderId, resourceType, amount, mode = REACTOR_MODE_BURST) {
        if (amount <= 0) return OK;
        if (!LAB_REACTIONS.hasOwnProperty(resourceType)) {
            return ERR_INVALID_ARGS;
        }
        if (this.memory.resources === undefined) {
            this.memory.resources = {
                lab: [],
                container: [],
                terminal: [],
                storage: []
            };
        }
        if (this.memory.resources.powerSpawn === undefined) this.memory.resources.powerSpawn = [];

        let lab_master = Game.getObjectById(orderId);
        if ( lab_master && lab_master.structureType === STRUCTURE_LAB ) {
            return this.placeBasicReactionOrder(orderId, resourceType, amount, 1);
        }

        let data = this.memory.resources;
        if ( data.reactions ) {
            let reactorType = data.reactions.reactorType;
            switch ( data.reactions.reactorType ) {
                case REACTOR_TYPE_FLOWER:
                    this.placeFlowerReactionOrder(orderId, resourceType, amount, mode);
                    break;
                default:
                    break;
            }
        } else {
            if (global.DEBUG && global.TRACE) trace("Room", { roomName: this.name, actionName: 'placeRoomOrder', subAction: 'no_reactor' })
            return ERR_INVALID_TARGET;
        }

        return OK;
    };

    Room.prototype.registerReactorFlower = function(seed_a_id, seed_b_id) {
        if ( this.memory.resources === undefined ) {
            this.memory.resources = {
                lab: [],
                container: [],
                terminal: [],
                storage: []
            };
        }
        if ( this.memory.resources.powerSpawn === undefined ) this.memory.resources.powerSpawn = [];

        let seed_a = Game.getObjectById(seed_a_id);
        let seed_b = Game.getObjectById(seed_b_id);
        if ( !seed_a || !seed_b || seed_a.structureType !== STRUCTURE_LAB || seed_b.structureType !== STRUCTURE_LAB ) return ERR_INVALID_TARGET;

        let data = this.memory.resources;
        if ( data.reactions === undefined ) data.reactions = {
            orders: [],
        };
        data.reactions.reactorType = REACTOR_TYPE_FLOWER;
        data.reactions.reactorMode = REACTOR_MODE_IDLE;
        data.reactions.seed_a = seed_a_id;
        data.reactions.seed_b = seed_b_id;

        data_a = data.lab.find( l => l.id === seed_a_id );
        if ( data_a ) {
            data_a.reactionState = LAB_SEED;
        }
        data_b = data.lab.find( l => l.id === seed_b_id );
        if ( data_b ) {
            data_b.reactionState = LAB_SEED;
        }

        return OK;
    };
    // New Room methods go here
};