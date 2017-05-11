// save original API functions
let find = Room.prototype.find;

let mod = {};
module.exports = mod;
mod.register = function() {
    Room.costMatrixInvalid.on(room => Room.rebuildCostMatrix(room.name || room));
    Flag.found.on(flag => Room.roomLayout(flag));
};
mod.pathfinderCache = {};
mod.pathfinderCacheDirty = false;
mod.pathfinderCacheLoaded = false;
mod.COSTMATRIX_CACHE_VERSION = 3; // change this to invalidate previously cached costmatrices
mod.extend = function(){
    let Container = function(room){
        this.room = room;

        Object.defineProperties(this, {
            'all': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._container) ){
                        this._container = [];
                        let add = entry => {
                            let cont = Game.getObjectById(entry.id);
                            if( cont ) {
                                _.assign(cont, entry);
                                this._container.push(cont);
                            }
                        };
                        _.forEach(this.room.memory.container, add);
                    }
                    return this._container;
                }
            },
            'controller': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._controller) ){
                        if( this.room.my && this.room.controller.memory.storage ){
                            this._controller = [Game.getObjectById(this.room.controller.memory.storage)];
                            if( !this._controller[0] ) delete this.room.controller.memory.storage;
                        } else {
                            let byType = c => c.controller == true;
                            this._controller = _.filter(this.all, byType);
                        }
                    }
                    return this._controller;
                }
            },
            'in': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._in) ){
                        let byType = c => c.controller == false;
                        this._in = _.filter(this.all, byType);
                        // add managed
                        let isFull = c => c.sum >= (c.storeCapacity * (1-MANAGED_CONTAINER_TRIGGER));
                        this._in = this._in.concat(this.managed.filter(isFull));
                    }
                    return this._in;
                }
            },
            'out': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._out) ){
                        let byType = c => c.controller == true;
                        this._out = _.filter(this.all, byType);
                        // add managed
                        let isEmpty = c => c.sum <= (c.storeCapacity * MANAGED_CONTAINER_TRIGGER);
                        this._out = this._out.concat(this.managed.filter(isEmpty));
                    }
                    return this._out;
                }
            },
            'privateers': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._privateers) ){
                        let byType = c => (c.source === false && !c.mineral && c.sum < c.storeCapacity);
                        this._privateers = _.filter(this.all, byType);
                    }
                    return this._privateers;
                }
            },
            'managed': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._managed) ){
                        let byType = c => c.source === true && c.controller == true;
                        this._managed = _.filter(this.all, byType);
                    }
                    return this._managed;
                }
            }
        });
    };

    let Links = function(room){
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
                        _.forEach(this.room.memory.links, add);
                    }
                    return this._all;
                }
            },
            'controller': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._controller) ){
                        let byType = c => c.controller === true;
                        this._controller = this.all.filter(byType);
                    }
                    return this._controller;
                }
            },
            'storage': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._storage) ) {
                        let byType = l => l.storage == true;
                        this._storage = this.all.filter(byType);
                    }
                    return this._storage;
                }
            },
            'in': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._in) ) {
                        let byType = l => l.storage == false && l.controller == false;
                        this._in = _.filter(this.all, byType);
                    }
                    return this._in;
                }
            },
            'privateers': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._privateers) ) {
                        let byType = l => l.storage == false && l.controller == false && l.source == false && l.energy < l.energyCapacity * 0.85;
                        this._privateers = _.filter(this.all, byType);
                    }
                    return this._privateers;
                }
            }
        });
    };

    let Labs = function(room){
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
                        let byType = l => l.storage == true;
                        this._storage = this.all.filter(byType);
                    }
                    return this._storage;
                }
            }
        });
    };

    let PowerSpawns = function(room){
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
                        _.forEach(this.room.memory.powerSpawns, add);
                    }
                    return this._all;
                }
            },
        });
    };

    let Nukers = function(room){
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
                        _.forEach(this.room.memory.nukers, add);
                    }
                    return this._all;
                }
            },
        });
    };

    let Structures = function(room){
        this.room = room;

        Object.defineProperties(this, {
            'all': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._all) ){
                        this._all = this.room.find(FIND_STRUCTURES);
                    }
                    return this._all;
                }
            },
            'my': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._my) ){
                        this._my = this.room.find(FIND_MY_STRUCTURES);
                    }
                    return this._my;
                }
            },
            'spawns': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._spawns) ){
                        this._spawns = [];
                        var addSpawn = id => { addById(this._spawns, id); };
                        _.forEach(this.room.memory.spawns, addSpawn);
                    }
                    return this._spawns;
                }
            },
            'towers': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._towers) ){
                        this._towers = [];
                        var add = id => { addById(this._towers, id); };
                        _.forEach(this.room.memory.towers, add);
                    }
                    return this._towers;
                }
            },
            'repairable': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._repairable) ){
                        let that = this;
                        this._repairable = _.sortBy(
                            that.all.filter(
                                structure => (
                                    // is not at 100%
                                    structure.hits < structure.hitsMax &&
                                    // not owned room or hits below RCL repair limit
                                    ( !that.room.my || structure.hits < MAX_REPAIR_LIMIT[that.room.controller.level] || structure.hits < (LIMIT_URGENT_REPAIRING + (2*DECAY_AMOUNT[structure.structureType] || 0))) &&
                                    // not decayable or below threshold
                                    ( !DECAYABLES.includes(structure.structureType) || (structure.hitsMax - structure.hits) > GAP_REPAIR_DECAYABLE ) &&
                                    // not pavement art
                                    ( Memory.pavementArt[that.room.name] === undefined || Memory.pavementArt[that.room.name].indexOf('x'+structure.pos.x+'y'+structure.pos.y+'x') < 0 ) &&
                                    // not flagged for removal
                                    ( !FlagDir.list.some(f => f.roomName == structure.pos.roomName && f.color == COLOR_ORANGE && f.x == structure.pos.x && f.y == structure.pos.y) )
                                )
                            ),
                            'hits'
                        );
                    }
                    return this._repairable;
                }
            },
            'urgentRepairable': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._urgentRepairableSites) ){
                        var isUrgent = site => (site.hits < (LIMIT_URGENT_REPAIRING + (DECAY_AMOUNT[site.structureType] || 0)));
                        this._urgentRepairableSites = _.filter(this.repairable, isUrgent);
                    }
                    return this._urgentRepairableSites;
                }
            },
            'fortifyable': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._fortifyableSites) ){
                        let that = this;
                        this._fortifyableSites = _.sortBy(
                            that.all.filter(
                                structure => (
                                    that.room.my &&
                                    structure.hits < structure.hitsMax &&
                                    structure.hits < MAX_FORTIFY_LIMIT[that.room.controller.level] &&
                                    ( structure.structureType != STRUCTURE_CONTAINER || structure.hits < MAX_FORTIFY_CONTAINER ) &&
                                    ( !DECAYABLES.includes(structure.structureType) || (structure.hitsMax - structure.hits) > GAP_REPAIR_DECAYABLE*3 ) &&
                                    ( Memory.pavementArt[that.room.name] === undefined || Memory.pavementArt[that.room.name].indexOf('x'+structure.pos.x+'y'+structure.pos.y+'x') < 0 ) &&
                                    ( !FlagDir.list.some(f => f.roomName == structure.pos.roomName && f.color == COLOR_ORANGE && f.x == structure.pos.x && f.y == structure.pos.y) )
                                )
                            ),
                            'hits'
                        );
                    }
                    return this._fortifyableSites;
                }
            },
            'fuelable': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._fuelables) ){
                        var that = this;
                        var factor = that.room.situation.invasion ? 1 : 0.82;
                        var fuelable = target => (target.energy < (target.energyCapacity * factor));
                        this._fuelables = _.sortBy( _.filter(this.towers, fuelable), 'energy') ; // TODO: Add Nuker
                    }
                    return this._fuelables;
                }
            },
            'container' : {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._container) ){
                        this._container = new Container(this.room);
                    }
                    return this._container;
                }
            },
            'links' : {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._links) ){
                        this._links = new Links(this.room);
                    }
                    return this._links;
                }
            },
            'labs' : {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._labs) ){
                        this._labs = new Labs(this.room);
                    }
                    return this._labs;
                }
            },
            'virtual': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._virtual) ){
                        this._virtual = _(this.all).concat(this.piles);
                    }
                    return this._virtual;
                }
            },
            'piles': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._piles) ){
                        const room = this.room;
                        this._piles = FlagDir.filter(FLAG_COLOR.command.drop, room.getPositionAt(25,25), true)
                            .map(function(flagInformation) {
                                const flag = Game.flags[flagInformation.name];
                                const piles = room.lookForAt(LOOK_ENERGY, flag.pos.x, flag.pos.y);
                                return piles.length && piles[0] || flag;
                            });
                    }
                    return this._piles;
                }
            },
            'observer': {
                configurable: true,
                get: function() {
                    if (_.isUndefined(this._observer) && this.room.memory.observer) {
	                    this._observer = Game.getObjectById(this.room.memory.observer.id);
                    }
                    return this._observer;
                },
            },
            'nuker': {
                configurable: true,
                get: function() {
                    if (_.isUndefined(this._nuker)) {
                        if (this.room.memory.nukers && this.room.memory.nukers.length > 0) {
                            this._nuker = Game.getObjectById(this.room.memory.nukers[0].id);
                        }
                    }
                    return this._nuker;
                },
            },
            'nukers': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._nukers) ){
                        this._nukers = new Nukers(this.room);
                    }
                    return this._nukers;
                }
            },
            'powerSpawn': {
                configurable: true,
                get: function() {
                    if (_.isUndefined(this._powerSpawn)) {
                        if (this.room.memory.powerSpawns && this.room.memory.powerSpawns.length > 0) {
                            this._powerSpawn = Game.getObjectById(this.room.memory.powerSpawns[0].id);
                        }
                    }
                    return this._powerSpawn;
                }
            },
            'powerSpawns': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._powerSpawns) ){
                        this._powerSpawns = new PowerSpawns(this.room);
                    }
                    return this._powerSpawns;
                }
            },
            'extensions': {
                configurable: true,
                get: function() {
                    if (_.isUndefined(this.room.memory.extensions)) {
                        this.room.saveExtensions();
                    }
                    if (_.isUndefined(this._extensions)) {
                        this._extensions = _.map(this.room.memory.extensions, e => Game.getObjectById(e));
                    }
                    return this._extensions;
                },
            }
        });
    };

    Object.defineProperties(Room.prototype, {
        'structures': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._structures) ){
                    this._structures = new Structures(this);
                }
                return this._structures;
            }
        },
        'sources': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this.memory.sources) || this.name == 'sim') {
                    this._sources = this.find(FIND_SOURCES);
                    if( this._sources.length > 0 ){
                        this.memory.sources = this._sources.map(s => s.id);
                    } else this.memory.sources = [];
                }
                if( _.isUndefined(this._sources) ){
                    this._sources = [];
                    var addSource = id => { addById(this._sources, id); };
                    this.memory.sources.forEach(addSource);
                }
                return this._sources;
            }
        },
        'powerBank': {
            configurable: true,
            get: function() {
                if (_.isUndefined(this.memory.powerBank)) {
                    [this._powerBank] = this.find(FIND_STRUCTURES, {
                        filter: s => s instanceof StructurePowerBank
                    });
                    if (this._powerBank) {
                        this.memory.powerBank = this._powerBank.id;
                    }
                }
                if (_.isUndefined(this._powerBank)) {
                    this._powerBank = Game.getObjectById(this.memory.powerBank);
                }
                return this._powerBank;
            },
        },
        'droppedResources': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._droppedResources) ){
                    this._droppedResources = this.find(FIND_DROPPED_RESOURCES);
                }
                return this._droppedResources;
            }
        },
        'sourceAccessibleFields': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this.memory.sourceAccessibleFields)) {
                    let sourceAccessibleFields = 0;
                    let sources = this.sources;
                    var countAccess = source => sourceAccessibleFields += source.accessibleFields;
                    _.forEach(sources, countAccess);
                    this.memory.sourceAccessibleFields = sourceAccessibleFields;
                }
                return this.memory.sourceAccessibleFields;
            }
        },
        'sourceEnergyAvailable': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._sourceEnergyAvailable) ){
                    this._sourceEnergyAvailable = 0;
                    var countEnergy = source => (this._sourceEnergyAvailable += source.energy);
                    _.forEach(this.sources, countEnergy);
                }
                return this._sourceEnergyAvailable;
            }
        },
        'ticksToNextRegeneration': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._ticksToNextRegeneration) ){
                    this._ticksToNextRegeneration = _(this.sources).map('ticksToRegeneration').min() || 0;
                }
                return this._ticksToNextRegeneration;
            }
        },
        'relativeEnergyAvailable': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._relativeEnergyAvailable) ){
                    this._relativeEnergyAvailable = this.energyCapacityAvailable > 0 ? this.energyAvailable / this.energyCapacityAvailable : 0;
                }
                return this._relativeEnergyAvailable;
            }
        },
        'reservedSpawnEnergy': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._reservedSpawnEnergy) ) {
                    this._reservedSpawnEnergy = 0;
                }
                return this._reservedSpawnEnergy;
            },
            set: function(value) {
                this._reservedSpawnEnergy = value;;
            }
        },
        'remainingEnergyAvailable': {
            configurable: true,
            get: function() {
                return this.energyAvailable - this.reservedSpawnEnergy;
            }
        },
        'relativeRemainingEnergyAvailable': {
            configurable: true,
            get: function() {
                return this.energyCapacityAvailable > 0 ? this.remainingEnergyAvailable / this.energyCapacityAvailable : 0;
            }
        },
        'towerFreeCapacity': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._towerFreeCapacity) ) {
                    this._towerFreeCapacity = 0;
                    var addFreeCapacity = tower => this._towerFreeCapacity += (tower.energyCapacity - tower.energy);
                    _.forEach(this.structures.towers, addFreeCapacity);
                }
                return this._towerFreeCapacity;
            }
        },
        'constructionSites': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._constructionSites) ) {
                    this._constructionSites = this.find(FIND_CONSTRUCTION_SITES);
                }
                return this._constructionSites;
            }
        },
        'myConstructionSites': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._myConstructionSites) ) {
                    this._myConstructionSites = this.find(FIND_MY_CONSTRUCTION_SITES);
                }
                return this._myConstructionSites;
            }
        },
        'creeps': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._creeps) ){
                    this._creeps = this.find(FIND_MY_CREEPS);
                }
                return this._creeps;
            }
        },
        'allCreeps': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._allCreeps) ){
                    this._allCreeps = this.find(FIND_CREEPS);
                }
                return this._allCreeps;
            }
        },
        'immobileCreeps': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._immobileCreeps) ){
                    this._immobileCreeps = _.filter(this.creeps, c => {
                        const s = c.data && c.data.determinatedSpot;
                        return s && c.pos.isEqualTo(c.room.getPositionAt(s.x, s.y));
                    });
                }
                return this._immobileCreeps;
            }
        },
        'hostiles': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._hostiles) ){
                    this._hostiles = this.find(FIND_HOSTILE_CREEPS, { filter : Task.reputation.hostileOwner });
                }
                return this._hostiles;
            }
        },
        'hostileIds': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._hostileIds) ){
                    this._hostileIds = _.map(this.hostiles, 'id');
                }
                return this._hostileIds;
            }
        },
        'combatCreeps': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._combatCreeps) ){
                    this._combatCreeps = this.creeps.filter( c => ['melee','ranger','healer', 'warrior'].includes(c.data.creepType) );
                }
                return this._combatCreeps;
            }
        },
        'casualties': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._casualties) ){
                    var isInjured = creep => creep.hits < creep.hitsMax &&
                        (creep.towers === undefined || creep.towers.length == 0);
                    this._casualties = _.sortBy(_.filter(this.creeps, isInjured), 'hits');
                }
                return this._casualties;
            }
        },
        'situation': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._situation) ){
                    this._situation = {
                        noEnergy: this.sourceEnergyAvailable == 0,
                        invasion: this.hostiles.length > 0 && (!this.controller || !this.controller.safeMode)
                    }
                }
                return this._situation;
            }
        },
        'roadConstructionTrace': {
            configurable: true,
            get: function () {
                if (_.isUndefined(this.memory.roadConstructionTrace) ) {
                    this.memory.roadConstructionTrace = {};
                }
                return this.memory.roadConstructionTrace;
            }
        },
        'adjacentRooms': {
            configurable: true,
            get: function () {
                if (_.isUndefined(this.memory.adjacentRooms) ) {
                    this.memory.adjacentRooms = Room.adjacentRooms(this.name);
                }
                return this.memory.adjacentRooms;
            }
        },
        'adjacentAccessibleRooms': {
            configurable: true,
            get: function () {
                if (_.isUndefined(this.memory.adjacentAccessibleRooms) ) {
                    this.memory.adjacentAccessibleRooms = Room.adjacentAccessibleRooms(this.name);
                }
                return this.memory.adjacentAccessibleRooms;
            }
        },
        'privateerMaxWeight': {
            configurable: true,
            get: function () {
                if (_.isUndefined(this._privateerMaxWeight) ) {
                    this._privateerMaxWeight = 0;
                    if ( !this.situation.invasion && !this.conserveForDefense ) {
                        let base = this.controller.level * 1000;
                        let that = this;
                        let adjacent, ownNeighbor, room, mult;

                        let flagEntries = FlagDir.filter([FLAG_COLOR.invade.robbing, FLAG_COLOR.invade.exploit]);
                        let countOwn = roomName => {
                            if( roomName == that.name ) return;
                            if( Room.isMine(roomName) ) ownNeighbor++;
                        };
                        let calcWeight = flagEntry => {
                            if( !this.adjacentAccessibleRooms.includes(flagEntry.roomName) ) return;
                            room = Game.rooms[flagEntry.roomName];
                            if( room ) {
                                adjacent = room.adjacentAccessibleRooms;
                                mult = room.sources.length;
                            } else {
                                adjacent = Room.adjacentAccessibleRooms(flagEntry.roomName);
                                mult = 1;
                            }
                            ownNeighbor = 1;
                            adjacent.forEach(countOwn);
                            that._privateerMaxWeight += (mult * base / ownNeighbor);
                        };
                        flagEntries.forEach(calcWeight);
                    }
                };
                return this._privateerMaxWeight;
            }
        },
        'claimerMaxWeight': {
            configurable: true,
            get: function () {
                if (_.isUndefined(this._claimerMaxWeight) ) {
                    this._claimerMaxWeight = 0;
                    let base = 1250;
                    let maxRange = 2;
                    let that = this;
                    let distance, reserved, flag;
                    let rcl = this.controller.level;

                    let flagEntries = FlagDir.filter([FLAG_COLOR.claim, FLAG_COLOR.claim.reserve, FLAG_COLOR.invade.exploit]);
                    let calcWeight = flagEntry => {
                        // don't spawn claimer for reservation at RCL < 4 (claimer not big enough)
                        if( rcl > 3 || (flagEntry.color == FLAG_COLOR.claim.color && flagEntry.secondaryColor == FLAG_COLOR.claim.secondaryColor )) {
                            distance = Room.roomDistance(that.name, flagEntry.roomName);
                            if( distance > maxRange )
                                return;
                            flag = Game.flags[flagEntry.name];
                            if( flag.room && flag.room.controller && flag.room.controller.reservation && flag.room.controller.reservation.ticksToEnd > 2500)
                                return;

                            reserved = flag.targetOf && flag.targetOf ? _.sum( flag.targetOf.map( t => t.creepType == 'claimer' ? t.weight : 0 )) : 0;
                            that._claimerMaxWeight += (base - reserved);
                        };
                    };
                    flagEntries.forEach(calcWeight);
                };
                return this._claimerMaxWeight;
            }
        },
        'conserveForDefense': {
            configurable: true,
            get: function () {
                return (this.my && this.storage && this.storage.charge < 0);
            }
        },
        'hostileThreatLevel': {
            configurable: true,
            get: function () {
                if (_.isUndefined(this._hostileThreatLevel) ) {
                    // TODO: add towers when in foreign room
                    this._hostileThreatLevel = 0;
                    let evaluateBody = creep => {
                        this._hostileThreatLevel += creep.threat;
                    };
                    this.hostiles.forEach(evaluateBody);
                }
                return this._hostileThreatLevel;
            }
        },
        'defenseLevel': {
            configurable: true,
            get: function () {
                if (_.isUndefined(this._defenseLevel) ) {
                    this._defenseLevel = {
                        towers: 0,
                        creeps: 0,
                        sum: 0
                    }
                    let evaluate = creep => {
                        this._defenseLevel.creeps += creep.threat;
                    };
                    this.combatCreeps.forEach(evaluate);
                    this._defenseLevel.towers = this.structures.towers.length;
                    this._defenseLevel.sum = this._defenseLevel.creeps + (this._defenseLevel.towers * Creep.partThreat.tower);
                }
                return this._defenseLevel;
            }
        },
        'minerals': {
            configurable:true,
            get: function () {
                if( _.isUndefined(this._minerals) ){
                    this._minerals = [];
                    let add = id => { addById(this._minerals, id); };
                    _.forEach(this.memory.minerals, add);
                }
                return this._minerals;
            }
        },
        'mineralType': {
            configurable:true,
            get: function () {
                if( _.isUndefined(this.memory.mineralType)) {
                    let minerals = this.find(FIND_MINERALS);
                    if( minerals && minerals.length > 0 )
                        this.memory.mineralType = minerals[0].mineralType;
                    else this.memory.mineralType = '';
                }
                return this.memory.mineralType;
            }
        },
        'structureMatrix': {
            configurable: true,
            get: function () {
                if (_.isUndefined(this._structureMatrix)) {
                    const cached = Room.getCachedStructureMatrix(this.name);
                    if (cached && cached.valid) {
                        this._structureMatrix = cached.costMatrix;
                    } else {
                        if (DEBUG) logSystem(this.name, 'Calculating cost matrix');
                        var costMatrix = new PathFinder.CostMatrix();
                        let setCosts = structure => {
                            const site = structure instanceof ConstructionSite;
                            // don't walk on allied construction sites.
                            if (site && !structure.my && Task.reputation.allyOwner(structure)) return costMatrix.set(structure.pos.x, structure.pos.y, 0xFF);
                            if (structure.structureType === STRUCTURE_ROAD) {
                                if (!site || USE_UNBUILT_ROADS)
                                    return costMatrix.set(structure.pos.x, structure.pos.y, 1);
                            } else if (structure.structureType === STRUCTURE_PORTAL) {
                                return costMatrix.set(structure.pos.x, structure.pos.y, 0xFF); // only take final step onto portals
                            } else if (OBSTACLE_OBJECT_TYPES.includes(structure.structureType)) {
                                if (!site || Task.reputation.allyOwner(structure)) // don't set for hostile construction sites
                                    return costMatrix.set(structure.pos.x, structure.pos.y, 0xFF);
                            } else if (structure.structureType === STRUCTURE_RAMPART && !structure.my && !structure.isPublic) {
                                if (!site || Task.reputation.allyOwner(structure)) // don't set for hostile construction sites
                                    return costMatrix.set(structure.pos.x, structure.pos.y, 0xFF);
                            }
                        };
                        this.structures.all.forEach(setCosts);
                        this.constructionSites.forEach(setCosts);
                        this.immobileCreeps.forEach(c => costMatrix.set(c.pos.x, c.pos.y, 0xFF));
                        const prevTime = _.get(mod.pathfinderCache, [this.name, 'updated']);
                        mod.pathfinderCache[this.name] = {
                            costMatrix: costMatrix,
                            updated: Game.time,
                            version: mod.COSTMATRIX_CACHE_VERSION
                        };
                        mod.pathfinderCacheDirty = true;
                        if( DEBUG && TRACE ) trace('PathFinder', {roomName:this.name, prevTime, structures:this.structures.all.length, PathFinder:'CostMatrix'}, 'updated costmatrix');
                        this._structureMatrix = costMatrix;
                    }
                }
                return this._structureMatrix;
            }
        },
        'creepMatrix': {
            configurable: true,
            get: function () {
                if (_.isUndefined(this._creepMatrix) ) {
                    const costs = Room.isSKRoom(this.name) ? this.structureMatrix.clone() : this.avoidSKMatrix.clone();
                    // Avoid creeps in the room
                    this.allCreeps.forEach(function(creep) {
                        costs.set(creep.pos.x, creep.pos.y, 0xff);
                    });
                    this._creepMatrix = costs;
                }
                return this._creepMatrix;
            }
        },
        'avoidSKMatrix': {
            configurable: true,
            get: function () {
                if (_.isUndefined(this._avoidSKMatrix)) {
                    const SKCreeps = this.hostiles.filter(c => c.owner.username === 'Source Keeper');
                    this._avoidSKMatrix = this.getAvoidMatrix({'Source Keeper': SKCreeps});
                }
                return this._avoidSKMatrix;
            }
        },
        'my': {
            configurable: true,
            get: function () {
                if (_.isUndefined(this._my) ) {
                    this._my = this.controller && this.controller.my;
                }
                return this._my;
            }
        },
        'reserved': {
            configurable: true,
            get: function () {
                if (_.isUndefined(this._reserved) ) {
                    if (this.controller) {
                        const myName = _.find(Game.spawns).owner.username;
                        this._reserved = this.controller.my || (this.controller.reservation
                            && this.controller.reservation.username === myName);
                    } else {
                        this._reserved = false;
                    }
                }
                return this._reserved;
            },
        },
        'owner': {
            configurable: true,
            get: function () {
                if (_.isUndefined(this._owner)) {
                    if (this.controller && this.controller.owner) {
                        this._owner = this.controller.owner.username;
                    } else {
                        this._owner = false;
                    }
                }
                return this._owner;
            },
        },
        'reservation': {
            configurable: true,
            get: function () {
                if (_.isUndefined(this._reservation)) {
                    if (this.controller && this.controller.reservation) {
                        this._reservation = this.controller.reservation.username;
                    } else {
                        this._reservation = false;
                    }
                }
                return this._reservation;
            },
        },
        'ally': {
            configurable: true,
            get: function () {
                if (_.isUndefined(this._ally)) {
                    if (this.reserved) {
                        this._ally = true;
                    } else if (this.controller) {
                        this._ally = Task.reputation.isAlly(this.owner) || Task.reputation.isAlly(this.reservation);
                    } else {
                        this._ally = false;
                    }
                }
                return this._ally;
            },
        },
        'spawnQueueHigh': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this.memory.spawnQueueHigh) ) {
                    this.memory.spawnQueueHigh = [];
                }
                return this.memory.spawnQueueHigh;
            }
        },
        'spawnQueueMedium': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this.memory.spawnQueueMedium) ) {
                    this.memory.spawnQueueMedium = [];
                }
                return this.memory.spawnQueueMedium;
            }
        },
        'spawnQueueLow': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this.memory.spawnQueueLow) ) {
                    this.memory.spawnQueueLow = [];
                }
                return this.memory.spawnQueueLow;
            }
        },
        'pavementArt': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this.memory.pavementArt) ) {
                    this.memory.pavementArt = [];
                }
                return this.memory.pavementArt;
            }
        },
        'collapsed': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._collapsed) ) {
                    // only if owned
                    if( !this.my ) {
                        this._collapsed = false;
                        return;
                    }
                    // no creeps ? collapsed!
                    if( !this.population ) {
                        this._collapsed = true;
                        return;
                    }
                    // is collapsed if workers + haulers + pioneers in room = 0
                    let workers = this.population.typeCount['worker'] ? this.population.typeCount['worker'] : 0;
                    let haulers = this.population.typeCount['hauler'] ? this.population.typeCount['hauler'] : 0;
                    let pioneers = this.population.typeCount['pioneer'] ? this.population.typeCount['pioneer'] : 0;
                    this._collapsed = (workers + haulers + pioneers) === 0;
                }
                return this._collapsed;
            }
        },
        'hostile': {
            configurable: true,
            get: function() {
                return this.memory.hostile;
            }
        },
    });
    Room.prototype.countMySites = function() {
        const numSites = _.size(this.myConstructionSites);
        if (!_.isUndefined(this.memory.myTotalSites) && numSites !== this.memory.myTotalSites) {
            Room.costMatrixInvalid.trigger(this);
        }
        if (numSites > 0) this.memory.myTotalSites = numSites;
        else delete this.memory.myTotalSites;
    };
    Room.prototype.countMyStructures = function() {
        const numStructures = _.size(this.structures.my);
        // only trigger when a structure has been destroyed, we already avoid unpathable construction sites, and treat road sites like roads
        if (!_.isUndefined(this.memory.myTotalStructures) && numStructures < this.memory.myTotalStructures) {
            Room.costMatrixInvalid.trigger(this);
        }
        if (numStructures > 0) this.memory.myTotalStructures = numStructures;
        else delete this.memory.myTotalStructures;
    };
    Room.prototype.registerIsHostile = function() {
        if (this.controller) {
            if (_.isUndefined(this.hostile) || typeof this.hostile === 'number') { // not overridden by user
                if (this.controller.owner && !this.controller.my && !this.ally) {
                    this.memory.hostile = this.controller.level;
                } else {
                    delete this.memory.hostile;
                }
            }
        }
    };
    Room.prototype.getBorder = function(roomName) {
        return _.findKey(Game.map.describeExits(this.name), function(name) {
            return this.name === name;
        }, {name: roomName});
    };

    Room.prototype.find = function (c, opt) {
        if (_.isArray(c)) {
            return _(c)
                .map(x => find.call(this, x, opt))
                .flatten()
                .value();
        } else
            return find.apply(this, arguments);
    };

    Room.prototype.findRoute = function(destination, checkOwner = true, preferHighway = true){
        if (this.name == destination)  return [];
        const options = { checkOwner, preferHighway};
        return Game.map.findRoute(this, destination, {
            routeCallback: Room.routeCallback(this.name, destination, options)
        });
    };

    Room.prototype.getBestConstructionSiteFor = function(pos, filter = null) {
        let sites;
        if( filter ) sites = this.constructionSites.filter(filter);
        else sites = this.constructionSites;
        if( sites.length == 0 ) return null;
        let siteOrder = Util.fieldOrFunction(CONSTRUCTION_PRIORITY, this);
        let rangeOrder = site => {
            let order = siteOrder.indexOf(site.structureType);
            return pos.getRangeTo(site) + ( order < 0 ? 100000 : (order * 100) );
            //if( order < 0 ) return 100000 + pos.getRangeTo(site);
            //return ((order - (site.progress / site.progressTotal)) * 100) + pos.getRangeTo(site);
        };
        return _.min(sites, rangeOrder);
    };

    Room.prototype.roadConstruction = function( minDeviation = ROAD_CONSTRUCTION_MIN_DEVIATION ) {

        if( !ROAD_CONSTRUCTION_ENABLE || Game.time % ROAD_CONSTRUCTION_INTERVAL != 0 ) return;
        if( _.isNumber(ROAD_CONSTRUCTION_ENABLE) && (!this.my || ROAD_CONSTRUCTION_ENABLE > this.controller.level)) return;

        let data = Object.keys(this.roadConstructionTrace)
            .map( k => {
                return { // convert to [{key,n,x,y}]
                    'n': this.roadConstructionTrace[k], // count of steps on x,y cordinates
                    'x': k.charCodeAt(0)-32, // extract x from key
                    'y': k.charCodeAt(1)-32 // extraxt y from key
                };
            });

        let min = Math.max(ROAD_CONSTRUCTION_ABS_MIN, (data.reduce( (_sum, b) => _sum + b.n, 0 ) / data.length) * minDeviation);
        data = data.filter( e => {
            if (e.n >= min) {
                let structures = this.lookForAt(LOOK_STRUCTURES,e.x,e.y);
                return (structures.length === 0 || structures[0].structureType === STRUCTURE_RAMPART)
                    && this.lookForAt(LOOK_CONSTRUCTION_SITES,e.x,e.y).length === 0;
            } else {
                return false;
            }
        });

        // build roads on all most frequent used fields
        let setSite = pos => {
            if( DEBUG ) logSystem(this.name, `Constructing new road at ${pos.x}'${pos.y} (${pos.n} traces)`);
            this.createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD);
        };
        _.forEach(data, setSite);

        // clear old data
        this.roadConstructionTrace = {};
    };
    Room.prototype.recordMove = function(creep){
        if( !ROAD_CONSTRUCTION_ENABLE ) return;
        let x = creep.pos.x;
        let y = creep.pos.y;
        if ( x == 0 || y == 0 || x == 49 || y == 49 ||
            creep.carry.energy == 0 || creep.data.actionName == 'building' )
            return;

        let key = `${String.fromCharCode(32+x)}${String.fromCharCode(32+y)}_x${x}-y${y}`;
        if( !this.roadConstructionTrace[key] )
            this.roadConstructionTrace[key] = 1;
        else this.roadConstructionTrace[key]++;
    };
    Room.prototype.saveTowers = function(){
        let towers = this.find(FIND_MY_STRUCTURES, {
            filter: {structureType: STRUCTURE_TOWER}
        });
        if( towers.length > 0 ){
            var id = obj => obj.id;
            this.memory.towers = _.map(towers, id);
        } else delete this.memory.towers;
    };
    Room.prototype.saveSpawns = function(){
        let spawns = this.find(FIND_MY_SPAWNS);
        if( spawns.length > 0 ){
            let id = o => o.id;
            this.memory.spawns = _.map(spawns, id);
        } else delete this.memory.spawns;
    };
    Room.prototype.saveObserver = function() {
        this.memory.observer = {};
        [this.memory.observer.id] = this.find(FIND_MY_STRUCTURES, {
            filter: s => s instanceof StructureObserver
        }).map(s => s.id);
        if (_.isUndefined(this.memory.observer.id)) delete this.memory.observer;
    };
    Room.prototype.saveNukers = function() {
        let nukers = this.find(FIND_MY_STRUCTURES, {
            filter: (structure) => ( structure.structureType == STRUCTURE_NUKER )
        });
        if (nukers.length > 0) {
            this.memory.nukers = [];

            // for each entry add to memory ( if not contained )
            let add = (nuker) => {
                let nukerData = this.memory.nukers.find( (l) => l.id == nuker.id );
                if( !nukerData ) {
                    this.memory.nukers.push({
                        id: nuker.id,
                    });
                }
            };
            nukers.forEach(add);
        } else delete this.memory.nukers;
    };
    Room.prototype.savePowerSpawns = function() {
        let powerSpawns = this.find(FIND_MY_STRUCTURES, {
            filter: (structure) => ( structure.structureType == STRUCTURE_POWER_SPAWN )
        });
        if (powerSpawns.length > 0) {
            this.memory.powerSpawns = [];

            // for each entry add to memory ( if not contained )
            let add = (powerSpawn) => {
                let powerSpawnData = this.memory.powerSpawns.find( (l) => l.id == powerSpawn.id );
                if( !powerSpawnData ) {
                    this.memory.powerSpawns.push({
                        id: powerSpawn.id,
                    });
                }
            };
            powerSpawns.forEach(add);
        } else delete this.memory.powerSpawns;
    };
    Room.prototype.saveExtensions = function() {
        const extensions = this.find(FIND_MY_STRUCTURES, {
            filter: s => s instanceof StructureExtension
        }).map(s => s.id);
        if (extensions.length > 0) this.memory.extensions = extensions;
        else delete this.memory.extensions;
    };
    Room.prototype.saveContainers = function(){
        let containers = this.structures.all.filter(
            structure => structure.structureType == STRUCTURE_CONTAINER
        );
        if (containers.length > 0) {
            this.memory.container = [];
            let add = (cont) => {
                // TODO consolidate managed container code
                let minerals = this.find(FIND_MINERALS);
                let source = cont.pos.findInRange(this.sources, 2);
                let mineral = cont.pos.findInRange(minerals, 2);
                let isControllerContainer = !!(this.my && cont.pos.getRangeTo(this.controller) <= 4);
                this.memory.container.push({
                    id: cont.id,
                    source: (source.length > 0),
                    controller: isControllerContainer,
                    mineral: (mineral.length > 0),
                });
                let assignContainer = s => s.memory.container = cont.id;
                source.forEach(assignContainer);
                mineral.forEach(assignContainer);
            };
            containers.forEach(add);
        } else delete this.memory.container;

        if( this.terminal ) {
            // terminal in range <= 2 is too simplistic for certain room placements near sources. See #681
            // This solution finds all walkable source fields in a room, then compares adjacency with the terminal
            // The first room position adjacent to the terminal is remapped back to it's adjacent source for mapping to terminal
            let minerSpots = [];
            let findValidFields = s => { minerSpots = _(minerSpots).concat(Room.validFields(this.name, s.pos.x-1, s.pos.x+1, s.pos.y-1, s.pos.y+1, true)); };
            _.forEach(this.sources, findValidFields);
            let sourceField = this.terminal.pos.findClosestByRange(minerSpots, 1);
            let source = [];
            if(sourceField){
                if(this.sources.length == 1){
                    source = this.sources;
                } else {
                    source.push( sourceField.isNearTo(this.sources[0]) ? this.sources[0] : this.sources[1] );
                }
            }

            let mineral = this.terminal.pos.findInRange(this.minerals, 2);
            let assignTerminal = s => s.memory.terminal = this.terminal.id;
            source.forEach(assignTerminal);
            mineral.forEach(assignTerminal);
        }
        if( this.storage ) {
            let source = this.storage.pos.findInRange(this.sources, 2);
            let mineral = this.storage.pos.findInRange(this.minerals, 2);
            let assignStorage = s => s.memory.storage = this.storage.id;
            source.forEach(assignStorage);
            mineral.forEach(assignStorage);

            if( this.storage.pos.getRangeTo(this.controller) < 4 )
                this.controller.memory.storage = this.storage.id;
        }
    };
    Room.prototype.saveLinks = function(){
        let links = this.find(FIND_MY_STRUCTURES, {
            filter: (structure) => ( structure.structureType == STRUCTURE_LINK )
        });
        if (links.length > 0) {
            this.memory.links = [];
            let storageLinks = this.storage ? this.storage.pos.findInRange(links, 2).map(l => l.id) : [];

            // for each memory entry, keep if existing
            /*
            let kept = [];
            let keep = (entry) => {
                if( links.find( (c) => c.id == entry.id )){
                    entry.storage = storageLinks.includes(entry.id);
                    kept.push(entry);
                }
            };
            this.memory.links.forEach(keep);
            this.memory.links = kept;
            */
            this.memory.links = [];

            // for each link add to memory ( if not contained )
            let add = (link) => {
                // TODO consolidate managed container code
                if( !this.memory.links.find( (l) => l.id == link.id ) ) {
                    let isControllerLink = ( link.pos.getRangeTo(this.controller) <= 4 );
                    let isSource = false;
                    if( !isControllerLink ) {
                        let source = link.pos.findInRange(this.sources, 2);
                        let assign = s => s.memory.link = link.id;
                        source.forEach(assign);
                        isSource = source.length > 0;
                    }
                    this.memory.links.push({
                        id: link.id,
                        storage: storageLinks.includes(link.id),
                        controller: isControllerLink,
                        source: isSource
                    });
                }
            };
            links.forEach(add);
        } else delete this.memory.links;
    };
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
    Room.prototype.saveMinerals = function() {
        let toPos = o => {
            return {
                x: o.pos.x,
                y: o.pos.y
            };
        };
        let extractorPos = this.structures.all.filter(
            structure => structure.structureType == STRUCTURE_EXTRACTOR
        ).map(toPos);
        let hasExtractor = m => _.some(extractorPos, {
            x: m.pos.x,
            y: m.pos.y
        });
        const validMineral = this.find(FIND_MINERALS).filter(hasExtractor);
        if( validMineral.length > 0 ){
            let id = o => o.id;
            this.memory.minerals = _.map(validMineral, id);
        } else delete this.memory.minerals;
    };

    Room.prototype.linkDispatcher = function () {
        let filled = l => l.cooldown == 0 && l.energy >= (l.energyCapacity * (l.source ? 0.85 : 0.5));
        let empty = l =>  l.energy < l.energyCapacity * 0.15;
        let filledIn = this.structures.links.in.filter(filled);
        let emptyController = this.structures.links.controller.filter(empty);

        if( filledIn.length > 0  ){
            let emptyStorage = this.structures.links.storage.filter(empty);

            let handleFilledIn = f => { // first fill controller, then storage
                if( emptyController.length > 0 ){
                    f.transferEnergy(emptyController[0]);
                    emptyController.shift();
                } else if( emptyStorage.length > 0 ){
                    f.transferEnergy(emptyStorage[0]);
                    emptyStorage.shift();
                }
            }
            filledIn.forEach(handleFilledIn);
        }

        if( emptyController.length > 0 ){ // controller still empty, send from storage
            let filledStorage = this.structures.links.storage.filter(filled);
            let handleFilledStorage = f => {
                if( emptyController.length > 0 ){
                    f.transferEnergy(emptyController[0]);
                    emptyController.shift();
                }
            }
            filledStorage.forEach(handleFilledStorage);
        }
    };
    Room.prototype.processConstructionFlags = function() {
        if (!this.my || !Util.fieldOrFunction(SEMI_AUTOMATIC_CONSTRUCTION, this)) return;
        let sitesSize = _.size(Game.constructionSites);
        if (sitesSize >= 100) return;
        const LEVEL = this.controller.level;
        const POS = new RoomPosition(25, 25, this.name);
        const ARGS = [POS, true];
        const CONSTRUCT = (flag, type) => {
            if (sitesSize >= 100) return;
            if (!flag) return;
            const POS = new RoomPosition(flag.x, flag.y, flag.roomName);
            if (!POS) return;
            const sites = POS.lookFor(LOOK_CONSTRUCTION_SITES);
            if (sites && sites.length) return; // already a construction site
            const structures = POS.lookFor(LOOK_STRUCTURES).filter(s => !(s instanceof StructureRoad || s instanceof StructureRampart));
            if (structures && structures.length) return; // pre-existing structure here
            const r = POS.createConstructionSite(type);
            if (Util.fieldOrFunction(REMOVE_CONSTRUCTION_FLAG, this, type) && r === OK) {
                if (flag.name) {
                    flag = Game.flags[flag.name];
                    if (flag instanceof Flag) flag.remove();
                }
                sitesSize++;
            }
        };

        // Extensions
        let shortAmount = CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][LEVEL] - (this.structures.extensions.length + _.filter(this.constructionSites, s => s.structureType === STRUCTURE_EXTENSION).length);
        if (shortAmount > 0) {
            FlagDir.filter(FLAG_COLOR.construct, ...ARGS).splice(0, shortAmount).forEach(flag => {
                CONSTRUCT(flag, STRUCTURE_EXTENSION);
            });
        }

        // Spawns
        shortAmount = CONTROLLER_STRUCTURES[STRUCTURE_SPAWN][LEVEL] - (this.structures.spawns.length + _.filter(this.constructionSites, s => s.structureType === STRUCTURE_SPAWN).length);
        if (shortAmount > 0) {
            FlagDir.filter(FLAG_COLOR.construct.spawn, ...ARGS).splice(0, shortAmount).forEach(flag => {
                CONSTRUCT(flag, STRUCTURE_SPAWN);
            });
        }

        // Towers
        shortAmount = CONTROLLER_STRUCTURES[STRUCTURE_TOWER][LEVEL] - (this.structures.towers.length + _.filter(this.constructionSites, s => s.structureType === STRUCTURE_TOWER).length);
        if (shortAmount > 0) {
            FlagDir.filter(FLAG_COLOR.construct.tower, ...ARGS).splice(0, shortAmount).forEach(flag => {
                CONSTRUCT(flag, STRUCTURE_TOWER);
            });
        }

        // Links
        shortAmount = CONTROLLER_STRUCTURES[STRUCTURE_LINK][LEVEL] - (this.structures.links.all.length + _.filter(this.constructionSites, s => s.structureType === STRUCTURE_LINK).length);
        if (shortAmount > 0) {
            FlagDir.filter(FLAG_COLOR.construct.link, ...ARGS).splice(0, shortAmount).forEach(flag => {
                CONSTRUCT(flag, STRUCTURE_LINK);
            });
        }

        // Labs
        shortAmount = CONTROLLER_STRUCTURES[STRUCTURE_LAB][LEVEL] - (this.structures.labs.all.length + _.filter(this.constructionSites, s => s.structureType === STRUCTURE_LAB).length);
        if (shortAmount > 0) {
            FlagDir.filter(FLAG_COLOR.construct.lab, ...ARGS).splice(0, shortAmount).forEach(flag => {
                CONSTRUCT(flag, STRUCTURE_LAB);
            });
        }

        // Storage
        if (!this.storage && CONTROLLER_STRUCTURES[STRUCTURE_STORAGE][LEVEL] > 0) {
            FlagDir.filter(FLAG_COLOR.construct.storage, ...ARGS).splice(0, 1).forEach(flag => {
                CONSTRUCT(flag, STRUCTURE_STORAGE);
            });
        }

        // Terminal
        if (!this.terminal && CONTROLLER_STRUCTURES[STRUCTURE_TERMINAL][LEVEL] > 0) {
            FlagDir.filter(FLAG_COLOR.construct.terminal, ...ARGS).splice(0, 1).forEach(flag => {
                CONSTRUCT(flag, STRUCTURE_TERMINAL);
            });
        }

        // Observer
        if (!this.structures.observer && CONTROLLER_STRUCTURES[STRUCTURE_OBSERVER][LEVEL] > 0) {
            FlagDir.filter(FLAG_COLOR.construct.observer, ...ARGS).splice(0, 1).forEach(flag => {
                CONSTRUCT(flag, STRUCTURE_OBSERVER);
            });
        }

        // Nuker
        if (!this.structures.nuker && CONTROLLER_STRUCTURES[STRUCTURE_NUKER][LEVEL] > 0) {
            FlagDir.filter(FLAG_COLOR.construct.nuker, ...ARGS).splice(0, 1).forEach(flag => {
                CONSTRUCT(flag, STRUCTURE_NUKER);
            });
        }

        // Power Spawn
        if (!this.structures.powerSpawn && CONTROLLER_STRUCTURES[STRUCTURE_POWER_SPAWN][LEVEL] > 0) {
            FlagDir.filter(FLAG_COLOR.construct.powerSpawn, ...ARGS).splice(0, 1).forEach(flag => {
                CONSTRUCT(flag, STRUCTURE_POWER_SPAWN);
            });
        }

        // Extractor
        if (CONTROLLER_STRUCTURES[STRUCTURE_EXTRACTOR][LEVEL] > 0) {
            const [mineral] = this.find(FIND_MINERALS);
            const extractor = mineral.pos.lookFor(LOOK_STRUCTURES);
            if (extractor.length && extractor[0] instanceof StructureExtractor) return;
            CONSTRUCT(mineral.pos, STRUCTURE_EXTRACTOR);
        }
    };
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
    Room.prototype.updateRoomOrders = function () {
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
                        if (DEBUG && TRACE) trace("Room", { roomName: this.name, remoteRoom: room.name, actionName: 'updateRoomOrders', subAction: 'update', orderId: order.id, resourceType: order.type, amount: available })
                        amountRemaining -= (available - existingOffer.amount);
                        existingOffer.amount = available;
                    } else {
                        if (DEBUG && TRACE) trace("Room", { roomName: this.name, remoteRoom: room.name, actionName: 'updateRoomOrders', subAction: 'new', orderId: order.id, resourceType: order.type, amount: available })
                        if (DEBUG) logSystem(this.name, `Room offer from ${room.name} with id ${order.id} placed for ${available} ${order.type}.`);
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
    Room.prototype.fillARoomOrder = function () {
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
                if (DEBUG && TRACE) trace("Room", { actionName: 'fillARoomOrder', subAction: 'terminalOrder', roomName: this.name, targetRoomName: targetRoom.name, resourceType: offer.type, amount: amt });
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
                if (DEBUG && TRACE) trace("Room", { actionName: 'fillARoomOrder', roomName: this.name, targetRoomName: targetRoom.name, resourceType: offer.type, amount: amount });
                if (DEBUG) logSystem(this.name, `Room order filled to ${targetRoom.name} for ${amount} ${offer.type}.`);
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
    Room.prototype.terminalBroker = function () {
        if( !this.my || !this.terminal || !this.storage ) return;
        if (this.terminal.cooldown && this.terminal.cooldown > 0) return;
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
                if( DEBUG || SELL_NOTIFICATION ) logSystem(that.name, `Selling ${order.transactionAmount} ${mineral} for ${order.credits} (${order.price} ¢/${mineral}, ${order.transactionCost} e): ${translateErrorCode(result)}`);
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
                if( DEBUG ) logSystem(that.name, `Transferring 50k energy to ${targetRoom.name}: ${translateErrorCode(response)}`);
                transacting = response == OK;
            }
        }
        if ( !transacting ) {
            transacting = this.fillARoomOrder();
        }
    };
    Room.prototype.processInvaders = function(){
        let that = this;
        if( this.memory.hostileIds === undefined )
            this.memory.hostileIds = [];
        if (!SEND_STATISTIC_REPORTS) delete this.memory.statistics;
        else if (this.memory.statistics === undefined) {
            this.memory.statistics = {};
        }

        let registerHostile = creep => {
            if (Room.isCenterNineRoom(this.name)) return;
            // if invader id unregistered
            if( !that.memory.hostileIds.includes(creep.id) ){
                // handle new invader
                // register
                that.memory.hostileIds.push(creep.id);
                // save to trigger subscribers later
                that.newInvader.push(creep);
                // create statistics
                if( SEND_STATISTIC_REPORTS ) {
                    let bodyCount = JSON.stringify( _.countBy(creep.body, 'type') );
                    if(that.memory.statistics.invaders === undefined)
                        that.memory.statistics.invaders = [];
                    that.memory.statistics.invaders.push({
                        owner: creep.owner.username,
                        id: creep.id,
                        body: bodyCount,
                        enter: Game.time,
                        time: Date.now()
                    });
                }
            }
        };
        _.forEach(this.hostiles, registerHostile);

        let registerHostileLeave = id => {
            const creep = Game.getObjectById(id);
            const stillHostile = !creep || Task.reputation.hostileOwner(creep);
            // for each known invader
            if( !that.hostileIds.includes(id) && !stillHostile ) { // not found anymore or no longer hostile
                // save to trigger subscribers later
                that.goneInvader.push(id);
                // update statistics
                if( SEND_STATISTIC_REPORTS && that.memory.statistics && that.memory.statistics.invaders !== undefined && that.memory.statistics.invaders.length > 0 ){
                    let select = invader => invader.id == id && invader.leave === undefined;
                    let entry = _.find(that.memory.statistics.invaders, select);
                    if( entry != undefined ) entry.leave = Game.time;
                }
            }
        };
        _.forEach(this.memory.hostileIds, registerHostileLeave);

        this.memory.hostileIds = this.hostileIds;
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
                    if( DEBUG && TRACE ) trace("Room", { roomName: this.name, actionName: "processLabs", reactorType: REACTOR_TYPE_FLOWER, labId: reactor.id, resourceType: order.type, amountRemaining: order.amount } );
                }
            }
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
                if( DEBUG && TRACE ) trace("Room", { roomName: this.name, actionName: "processLabs", labId: master.id, resourceType: compound, amountRemaining: data.reactionAmount } );
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
    Room.prototype.processPower = function() {
        // run lab reactions WOO!
        let powerSpawns = this.find(FIND_MY_STRUCTURES, { filter: (s) => { return s.structureType == STRUCTURE_POWER_SPAWN; } } );
        for (var i=0;i<powerSpawns.length;i++) {
            // see if the reaction is possible
            let powerSpawn = powerSpawns[i];
            if (powerSpawn.energy >= POWER_SPAWN_ENERGY_RATIO && powerSpawn.power >= 1) {
                if (DEBUG && TRACE) trace('Room', { roomName: this.name, actionName: 'processPower' });
                powerSpawn.processPower();
            }
        }
    };
    Room.prototype.findContainerWith = function(resourceType, amountMin) {
        if (!amountMin) amountMin = 1;
        //if (!RESOURCES_ALL.find((r)=>{r==resourceType;})) return null;

        let data = this.memory;
        if (data && data.container && data.container.length > 0) {
            for (let i=0;i<data.container.length;i++) {
                let d = data.container[i];
                let container = Game.getObjectById(d.id);
                if (container) {
                    let amt = -container.getNeeds(resourceType);
                    if (!(this.structures.container.out.includes(container) && resourceType === RESOURCE_ENERGY) && amt > 0) {
                        let amount = amt;
                        if (amount >= amountMin) return { structure: container, amount: amount };
                    }
                }
            }
        }

        return null;
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
                    if (DEBUG && TRACE) trace("Room", { roomName: this.name, actionName: 'cancelOrder', orderId: orderId, resourceType: resourceType })
                    containerData.orders.splice( containerData.orders.indexOf(existingOrder), 1 );
                }
            } else {
                // delete all of structure's orders
                if (DEBUG && TRACE) trace("Room", { roomName: this.name, actionName: 'cancelOrder', orderId: orderId, resourceType: 'all' })
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
                if (DEBUG && TRACE) trace("Room", { roomName: this.name, actionName: 'cancelRoomOrder', orderId: orderId, resourceType: resourceType })
                orders.splice( orders.indexOf(existingOrder), 1 );
            }
        } else if ( orderId ) {
            // delete all orders matching orderId
            if (DEBUG && TRACE) trace("Room", { roomName: this.name, actionName: 'cancelRoomOrder', orderId: orderId, resourceType: 'all' })
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
            if (DEBUG && TRACE) trace("Room", { roomName: this.name, actionName: 'placeRoomOrder', subAction: 'update', orderId: orderId, resourceType: resourceType, amount: amount })
            existingOrder.amount = amount;
        } else {
            // create new order
            if (DEBUG && TRACE) trace("Room", { roomName: this.name, actionName: 'placeRoomOrder', subAction: 'new', orderId: orderId, resourceType: resourceType, amount: amount })
            if (DEBUG) logSystem(this.name, `New room order with id ${orderId} placed for ${amount} ${resourceType}.`);
            orders.push({
                id: orderId,
                type: resourceType,
                amount: amount,
                offers: []
            });
        }

        return OK;
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
    }
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
                if (DEBUG && TRACE) trace("Room", { roomName: this.name, actionName: 'placeReactionOrder', subAction: 'update', orderId: orderId, resourceType: resourceType, amount: amount })
                existingOrder.mode = mode;
                existingOrder.amount = amount;
            } else {
                // create new order
                if (DEBUG && TRACE) trace("Room", { roomName: this.name, actionName: 'placeReactionOrder', subAction: 'new', orderId: orderId, resourceType: resourceType, amount: amount })
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
            if (DEBUG && TRACE) trace("Room", { roomName: this.name, actionName: 'placeRoomOrder', subAction: 'no_reactor' })
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
    Room.prototype.isWalkable = function(x, y, look) {
        if (!look) look = this.lookAt(x,y);
        else look = look[y][x];
        let invalidObject = o => {
            return ((o.type == LOOK_TERRAIN && o.terrain == 'wall') ||
                OBSTACLE_OBJECT_TYPES.includes(o[o.type].structureType));
        };
        return look.filter(invalidObject).length == 0;
    };
    Room.prototype.exits = function(findExit, point) {
        if (point === true) point = 0.5;
        let positions;
        if (findExit === 0) {
            // portals
            positions = _.chain(this.find(FIND_STRUCTURES)).filter(function(s) {
                return s.structureType === STRUCTURE_PORTAL;
            }).map('pos').value();
        } else {
            positions = this.find(findExit);
        }

        // assuming in-order
        let maxX, maxY;
        let map = {};
        let limit = -1;
        const ret = [];
        for (let i = 0; i < positions.length; i++) {
            const pos = positions[i];
            if (!(_.get(map,[pos.x-1, pos.y]) || _.get(map,[pos.x,pos.y-1]))) {
                if (point && limit !== -1) {
                    ret[limit].x += Math.ceil(point * (maxX - ret[limit].x));
                    ret[limit].y += Math.ceil(point * (maxY - ret[limit].y));
                }
                limit++;
                ret[limit] = _.pick(pos, ['x','y']);
                maxX = pos.x;
                maxY = pos.y;
                map = {};
            }
            _.set(map, [pos.x, pos.y], true);
            maxX = Math.max(maxX, pos.x);
            maxY = Math.max(maxY, pos.y);
        }
        if (point && limit !== -1) {
            ret[limit].x += Math.ceil(point * (maxX - ret[limit].x));
            ret[limit].y += Math.ceil(point * (maxY - ret[limit].y));
        }
        return ret;
    }
    Room.prototype.showCostMatrix = function(matrixName, aroundPos) {
        const matrix = this[matrixName] || this.structureMatrix;
        const vis = new RoomVisual(this.name);
        let startY = 0;
        let endY = 50;
        let startX = 0;
        let endX = 50;
        if (aroundPos) {
            startY = Math.max(0, aroundPos.y - 3);
            endY = Math.min(50, aroundPos.y + 4);
            startX = Math.max(0, aroundPos.x - 3);
            endX = Math.min(50, aroundPos.x + 4);
        }
        const maxCost = _.max(matrix._bits);
        const getColourByPercentage = (value) => {
            const hue = ((1 - value) * 120).toString(10);
            return `hsl(${hue}, 100%, 50%)`;
        };
        for (var y = startY; y < endY; y++) {
            for (var x = startX; x < endX; x++) {
                const cost = matrix.get(x, y);
                if (cost) vis.text(cost, x, y);
                vis.rect(x - 0.5, y - 0.5, 1, 1, {fill: getColourByPercentage(cost / maxCost)});
            }
        }
    };
    Room.prototype.controlObserver = function() {
        const OBSERVER = this.structures.observer;
        if (!OBSERVER) return;
        if (!this.memory.observer.rooms) this.initObserverRooms();
        let nextRoom;
        if (observerRequests.length > 0) { // support for requesting rooms
            for (const request of observerRequests) {
                if (Game.map.getRoomLinearDistance(this.name, request.roomName) <= 10 && !Memory.observerSchedule.includes(request.roomName)) {
                    const room = request.room || Game.rooms[request.roomName];
                    if (room && room.creeps && room.creeps.length && room.creeps.length > 0) continue; // highly likely to have vision next tick as well
                    Memory.observerSchedule.push(request.roomName);
                    nextRoom = request.roomName;
                    break;
                }
            }
        }
        let i = 0;
        const ROOMS = this.memory.observer.rooms;
        if (!nextRoom) {
            let lastLookedIndex = Number.isInteger(this.memory.observer.lastLookedIndex) ? this.memory.observer.lastLookedIndex : ROOMS.length;
            do { // look ma! my first ever do-while loop!
                if (lastLookedIndex >= ROOMS.length) {
                    nextRoom = ROOMS[0];
                } else {
                    nextRoom = ROOMS[lastLookedIndex + 1];
                }
                lastLookedIndex = ROOMS.indexOf(nextRoom);
                if (++i >= ROOMS.length) { // safety check - prevents an infinite loop
                    break;
                }
            } while (Memory.observerSchedule.includes(nextRoom) || nextRoom in Game.rooms);
            this.memory.observer.lastLookedIndex = lastLookedIndex;
            Memory.observerSchedule.push(nextRoom);
        }
        const r = OBSERVER.observeRoom(nextRoom); // now we get to observe a room
        if (r === ERR_INVALID_ARGS && i < ROOMS.length) { // room has not yet been created / off the map (backup)
            Memory.observerSchedule.splice(Memory.observerSchedule.indexOf(nextRoom), 1); // remove invalid room from list
            this.controlObserver(); // should look at the next room (latest call will override previous calls on the same tick)
        }
    };
    // toAvoid - a list of creeps to avoid sorted by owner
    Room.prototype.getAvoidMatrix = function(toAvoid) {
        const avoidMatrix = this.structureMatrix.clone();
        for (const owner in toAvoid) {
            const creeps = toAvoid[owner];
            for (const creep of creeps) {
                for (let x = Math.max(0, creep.pos.x - 3); x <= Math.min(49, creep.pos.x + 3); x++) {
                    const deltaX = x < creep.pos.x ? creep.pos.x - x : x - creep.pos.x;
                    for (let y = Math.max(0, creep.pos.y - 3); y <= Math.min(49, creep.pos.y + 3); y++) {
                        const deltaY = y < creep.pos.y ? creep.pos.y - y : y - creep.pos.y;
                        const cost = 17 - (2 * Math.max(deltaX, deltaY));
                        avoidMatrix.set(x, y, cost) // make it less desirable than a swamp
                    }
                }
            }
        }
        return avoidMatrix;
    };
    Room.prototype.initObserverRooms = function() {
        const OBSERVER_RANGE = OBSERVER_OBSERVE_RANGE > 10 ? 10 : OBSERVER_OBSERVE_RANGE; // can't be > 10
        const [x, y] = Room.calcGlobalCoordinates(this.name, (x,y) => [x,y]); // hacky get x,y
        const [HORIZONTAL, VERTICAL] = Room.calcCardinalDirection(this.name);
        this.memory.observer.rooms = [];

        for (let a = x - OBSERVER_RANGE; a < x + OBSERVER_RANGE; a++) {
            for (let b = y - OBSERVER_RANGE; b < y + OBSERVER_RANGE; b++) {
                let hor = HORIZONTAL;
                let vert = VERTICAL;
                let n = a;
                if (a < 0) { // swap horizontal letter
                    hor = hor === 'W' ? 'E' : 'W';
                    n = Math.abs(a) - 1;
                }
                hor += n;
                n = b;
                if (b < 0) {
                    vert = vert === 'N' ? 'S' : 'N';
                    n = Math.abs(b) - 1;
                }
                vert += n;
                const room = hor + vert;
                if (OBSERVER_OBSERVE_HIGHWAYS_ONLY && !Room.isHighwayRoom(room)) continue; // we only want highway rooms
                if (room in Game.rooms && Game.rooms[room].my) continue; // don't bother adding the room to the array if it's owned by us
                if (!Game.map.isRoomAvailable(room)) continue; // not an available room
                this.memory.observer.rooms.push(room);
            }
        }
    };
    Room.prototype.invalidateCostMatrix = function() {
        Room.costMatrixInvalid.trigger(this.name);
    };
};
mod.flush = function(){
    let clean = room => {
        delete room._sourceEnergyAvailable;
        delete room._droppedResources;
        delete room._ticksToNextRegeneration;
        delete room._relativeEnergyAvailable;
        delete room._towerFreeCapacity;
        delete room._hostiles;
        delete room._hostileIds;
        delete room._situation;
        delete room._casualties;
        delete room._currentCostMatrix;
        delete room._isReceivingEnergy;
        delete room._reservedSpawnEnergy;
        delete room._creeps;
        delete room._immobileCreeps;
        delete room._allCreeps;
        delete room._privateerMaxWeight;
        delete room._claimerMaxWeight;
        delete room._combatCreeps;
        delete room._defenseLevel;
        delete room._hostileThreatLevel;
        delete room._collapsed;
        delete room._feedable;
        if( global.isNewServer ) {
            delete room._my;
            delete room._constructionSites;
            delete room._myConstructionSites;
            delete room._maxPerJob;
            delete room._minerals;
            delete room._structures;
        } else {
            delete room.structures._repairable;
            delete room.structures._urgentRepairableSites;
            delete room.structures._fortifyableSites;
            delete room.structures._fuelables;
        }
        if (!room._powerBank) {
            delete room.memory.powerBank;
        }
        room.newInvader = [];
        room.goneInvader = [];
    };
    Memory.observerSchedule = [];
    _.forEach(Game.rooms, clean);

    // Temporary migration can be removed once traveler is merged into /dev
    if (!_.isUndefined(Memory.rooms.hostileRooms)) {
        for (roomName in Memory.rooms.hostileRooms) {
            if (_.isUndefined(Memory.rooms[roomName])) Memory.rooms[roomName] = {};
            Memory.rooms[roomName].hostile = Memory.rooms.hostileRooms[roomName];
        }
        delete Memory.rooms.hostileRooms;
    }
};
mod.totalSitesChanged = function() {
    const numSites = _.size(Game.constructionSites);
    const oldSites = Memory.rooms.myTotalSites || 0;
    if (numSites > 0) Memory.rooms.myTotalSites = numSites;
    else delete Memory.rooms.myTotalSites;
    return oldSites && oldSites !== numSites;
};
mod.totalStructuresChanged = function() {
    const numStructures = _.size(Game.structures);
    const oldStructures = Memory.rooms.myTotalStructures || 0;
    if (numStructures > 0) Memory.rooms.myTotalStructures = numStructures;
    else delete Memory.rooms.myTotalStructures;
    return oldStructures && oldStructures !== numStructures;
};
mod.analyze = function() {
    const p = Util.startProfiling('Room.analyze', {enabled:PROFILING.ROOMS});
    const totalSitesChanged = Room.totalSitesChanged();
    const totalStructuresChanged = Room.totalStructuresChanged();
    const getEnvironment = room => {
        try {
            if (!room.memory.initialized || Game.time % MEMORY_RESYNC_INTERVAL == 0 || room.name == 'sim' ) {
                room.memory.initialized = Game.time;
                room.saveMinerals();
                room.saveTowers();
                room.saveSpawns();
                room.saveObserver();
                room.saveNukers();
                room.savePowerSpawns();
                room.saveExtensions();
                room.saveContainers();
                room.saveLinks();
                room.saveLabs();
                if (room.structures.observer) room.initObserverRooms(); // to re-evaluate rooms, in case parameters are changed
                room.processConstructionFlags();
            }
            if (Game.time % PROCESS_ORDERS_INTERVAL === 0 || room.name === 'sim') {
                room.updateResourceOrders();
                room.updateRoomOrders();
                room.terminalBroker();
            }
            room.roadConstruction();
            if (room.structures.links.all.length > 0) room.linkDispatcher();
            if (room.hostiles.length > 0) room.processInvaders();
            if (room.structures.labs.all.length > 0) room.processLabs();
            if (room.structures.powerSpawn) room.processPower();
            if (totalSitesChanged) room.countMySites();
            if (totalStructuresChanged) room.countMyStructures();
        }
        catch(err) {
            Game.notify('Error in room.js (Room.prototype.loop) for "' + room.name + '" : ' + err.stack ? err + '<br/>' + err.stack : err);
            console.log( dye(CRAYON.error, 'Error in room.js (Room.prototype.loop) for "' + room.name + '": <br/>' + (err.stack || err.toString()) + '<br/>' + err.stack));
        }
    };
    _.forEach(Game.rooms, r => {
        getEnvironment(r);
        p.checkCPU(r.name, PROFILING.ANALYZE_LIMIT / 5);
    });
};
mod.execute = function() {
    const p = Util.startProfiling('Room.execute', {enabled:PROFILING.ROOMS});
    let triggerNewInvaders = creep => {
        // create notification
        let bodyCount = JSON.stringify( _.countBy(creep.body, 'type') );
        if( DEBUG || NOTIFICATE_INVADER || (NOTIFICATE_INTRUDER && creep.room.my) || NOTIFICATE_HOSTILES ) logSystem(creep.pos.roomName, `Hostile intruder (${bodyCount}) from "${creep.owner.username}".`);
        if( NOTIFICATE_INVADER || (NOTIFICATE_INTRUDER && creep.owner.username !== 'Invader' && creep.room.my) || (NOTIFICATE_HOSTILES && creep.owner.username !== 'Invader') ){
            Game.notify(`Hostile intruder ${creep.id} (${bodyCount}) from "${creep.owner.username}" in room ${creep.pos.roomName} at ${toDateTimeString(toLocalDate(new Date()))}`);
        }
        // trigger subscribers
        Room.newInvader.trigger(creep);
    }
    let triggerKnownInvaders = id =>  Room.knownInvader.trigger(id);
    let triggerGoneInvaders = id =>  Room.goneInvader.trigger(id);
    let run = (memory, roomName) => {
        try {
            const p2 = Util.startProfiling(roomName, {enabled:PROFILING.ROOMS});
            let room = Game.rooms[roomName];
            if( room ){ // has sight
                room.goneInvader.forEach(triggerGoneInvaders);
                p2.checkCPU('Creep.execute.run:goneInvader', 0.5);
                room.hostileIds.forEach(triggerKnownInvaders);
                p2.checkCPU('Creep.execute.run:knownInvaders', 0.5);
                room.newInvader.forEach(triggerNewInvaders);
                p2.checkCPU('Creep.execute.run:newInvaders', 0.5);
                if (room.structures.towers.length > 0) Tower.loop(room);
                p2.checkCPU('Creep.execute.run:tower.loop', 0.5);
                if( room.collapsed ) Room.collapsed.trigger(room);
                p2.checkCPU('Creep.execute.run:collapsed', 0.5);
            }
            else { // no sight
                if( memory.hostileIds ) _.forEach(memory.hostileIds, triggerKnownInvaders);
                p2.checkCPU('Creep.execute.run:knownInvadersNoSight', 0.5);
            }
        } catch (e) {
            Util.logError(e.stack || e.message);
        }
    };
    _.forEach(Memory.rooms, (memory, roomName) => {
        run(memory, roomName);
        p.checkCPU(roomName + '.run', 1);
        let room = Game.rooms[roomName];
        if (room) {
            if (room.structures.observer) room.controlObserver();
            p.checkCPU(roomName + '.controlObserver', 0.5);
        }
    });
};
mod.cleanup = function() {
    // flush changes to the pathfinderCache but wait until load
    if (!_.isUndefined(Memory.pathfinder)) {
        OCSMemory.saveSegment(MEM_SEGMENTS.COSTMATRIX_CACHE, Memory.pathfinder);
        delete Memory.pathfinder;
    }
    if (mod.pathfinderCacheDirty && mod.pathfinderCacheLoaded) {
        // store our updated cache in the memory segment
        let encodedCache = {};
        for (const key in mod.pathfinderCache) {
            const entry = mod.pathfinderCache[key];
            if (entry.version === mod.COSTMATRIX_CACHE_VERSION) {
                encodedCache[key] = {
                    serializedMatrix: entry.serializedMatrix || entry.costMatrix.serialize(),
                    updated: entry.updated,
                    version: entry.version
                };
                // only set memory when we need to
                if (entry.stale) encodedCache[key].stale = true;
            }
        }
        OCSMemory.saveSegment(MEM_SEGMENTS.COSTMATRIX_CACHE, encodedCache);
        mod.pathfinderCacheDirty = false;
    }
};
mod.bestSpawnRoomFor = function(targetRoomName) {
    var range = room => room.my ? routeRange(room.name, targetRoomName) : Infinity;
    return _.min(Game.rooms, range);
};
// find a room to spawn
// params: { targetRoom, minRCL = 0, maxRange = Infinity, minEnergyAvailable = 0, minEnergyCapacity = 0, callBack = null, allowTargetRoom = false, rangeRclRatio = 3, rangeQueueRatio = 51 }
// requiredParams: targetRoom
mod.findSpawnRoom = function(params){
    if( !params || !params.targetRoom ) return null;
    // filter validRooms
    let isValidRoom = room => (
        room.my &&
        (params.maxRange === undefined || Util.routeRange(room.name, params.targetRoom) <= params.maxRange) &&
        (params.minEnergyCapacity === undefined || params.minEnergyCapacity <= room.energyCapacityAvailable) &&
        (params.minEnergyAvailable === undefined || params.minEnergyAvailable <= room.energyAvailable) &&
        (room.name != params.targetRoom || params.allowTargetRoom === true) &&
        (params.minRCL === undefined || room.controller.level >= params.minRCL) &&
        (params.callBack === undefined || params.callBack(room))
    );
    let validRooms = _.filter(Game.rooms, isValidRoom);
    if( validRooms.length == 0 ) return null;
    // select "best"
    // range + roomLevelsUntil8/rangeRclRatio + spawnQueueDuration/rangeQueueRatio
    let queueTime = queue => _.sum(queue, c => (c.parts.length*3));
    let roomTime = room => ((queueTime(room.spawnQueueLow)*0.9) + queueTime(room.spawnQueueMedium) + (queueTime(room.spawnQueueHigh)*1.1) ) / room.structures.spawns.length;
    let evaluation = room => { return routeRange(room.name, params.targetRoom) +
        ( (8-room.controller.level) / (params.rangeRclRatio||3) ) +
        ( roomTime(room) / (params.rangeQueueRatio||51) );
    }
    return _.min(validRooms, evaluation);
};
mod.routeCallback = function(origin, destination, options) {
    if (_.isUndefined(origin) || _.isUndefined(destination)) logError('Room.routeCallback', 'both origin and destination must be defined - origin:' + origin + ' destination:' + destination);
    return function(roomName) {
        if (Game.map.getRoomLinearDistance(origin, roomName) > options.restrictDistance)
            return false;
        if( roomName !== destination && ROUTE_ROOM_COST[roomName]) {
            return ROUTE_ROOM_COST[roomName];
        }
        let isHighway = false;
        if( options.preferHighway ){
            const parsed = /^[WE]([0-9]+)[NS]([0-9]+)$/.exec(roomName);
            isHighway = (parsed[1] % 10 === 0) || (parsed[2] % 10 === 0);
        }
        let isMyOrNeutralRoom = false;
        const hostile = _.get(Memory.rooms[roomName], 'hostile', false);
        if( options.checkOwner ){
            const room = Game.rooms[roomName];
            // allow for explicit overrides of hostile rooms using hostileRooms[roomName] = false
            isMyOrNeutralRoom = !hostile || (room &&
                                room.controller &&
                                (room.controller.my ||
                                (room.controller.owner === undefined)));
        }
        if (!options.allowSK && mod.isSKRoom(roomName)) return 10;
        if (!options.allowHostile && hostile &&
            roomName !== destination && roomName !== origin) {
            return Number.POSITIVE_INFINITY;
        }
        if (isMyOrNeutralRoom || roomName == origin || roomName == destination)
            return 1;
        else if (isHighway)
            return 3;
        else if( Game.map.isRoomAvailable(roomName))
            return (options.checkOwner || options.preferHighway) ? 11 : 1;
        return Number.POSITIVE_INFINITY;
    };
};
mod.getCostMatrix = function(roomName) {
    var room = Game.rooms[roomName];
    if(!room) return;
    return room.costMatrix;
};
mod.isMine = function(roomName) {
    let room = Game.rooms[roomName];
    return( room && room.my );
};

mod.calcCardinalDirection = function(roomName) {
    const parsed = /^([WE])[0-9]+([NS])[0-9]+$/.exec(roomName);
    return [parsed[1], parsed[2]];
};
mod.calcGlobalCoordinates = function(roomName, callBack) {
    if (!callBack) return null;
    const parsed = /^[WE]([0-9]+)[NS]([0-9]+)$/.exec(roomName);
    const x = +parsed[1];
    const y = +parsed[2];
    return callBack(x, y);
};
mod.calcCoordinates = function(roomName, callBack){
    if (!callBack) return null;
    return Room.calcGlobalCoordinates(roomName, (x, y) => {
        return callBack(x % 10, y % 10);
    });
};
mod.isCenterRoom = function(roomName){
    return Room.calcCoordinates(roomName, (x,y) => {
        return x === 5 && y === 5;
    });
};
mod.isCenterNineRoom = function(roomName){
    return Room.calcCoordinates(roomName, (x,y) => {
        return x > 3 && x < 7 && y > 3 && y < 7;
    });
};
mod.isControllerRoom = function(roomName){
    return Room.calcCoordinates(roomName, (x,y) => {
        return x !== 0 && y !== 0 && (x < 4 || x > 6 || y < 4 || y > 6);
    });
};
mod.isSKRoom = function(roomName){
    return Room.calcCoordinates(roomName, (x,y) => {
        return x > 3 && x < 7 && y > 3 && y < 7 && (x !== 5 || y !== 5);
    });
};
mod.isHighwayRoom = function(roomName){
    return Room.calcCoordinates(roomName, (x,y) => {
        return x === 0 || y === 0;
    });
};
mod.adjacentRooms = function(roomName){
    let parts = roomName.split(/([NESW])/);
    let dirs = ['N','E','S','W'];
    let toggle = q => dirs[ (dirs.indexOf(q)+2) % 4 ];
    let names = [];
    for( let x = parseInt(parts[2])-1; x < parseInt(parts[2])+2; x++ ){
        for( let y = parseInt(parts[4])-1; y < parseInt(parts[4])+2; y++ ){
            names.push( ( x < 0 ? toggle(parts[1]) + '0' : parts[1] + x ) + ( y < 0 ? toggle(parts[3]) + '0' : parts[3] + y ) );
        }
    }
    return names;
};
mod.adjacentAccessibleRooms = function(roomName, diagonal = true) {
    let validRooms = [];
    let exits = Game.map.describeExits(roomName);
    let addValidRooms = (roomName, direction) => {
        if( diagonal ) {
            let roomExits = Game.map.describeExits(roomName);
            let dirA = (direction + 1) % 8 + 1;
            let dirB = (direction + 5) % 8 + 1;
            if( roomExits && roomExits[dirA] && !validRooms.includes(roomExits[dirA]) )
                validRooms.push(roomExits[dirA]);
            if( roomExits && roomExits[dirB] && !validRooms.includes(roomExits[dirB]) )
                validRooms.push(roomExits[dirB]);
        }
        validRooms.push(roomName);
    }
    _.forEach(exits, addValidRooms);
    return validRooms;
};
mod.roomDistance = function(roomName1, roomName2, diagonal, continuous){
    if( diagonal ) return Game.map.getRoomLinearDistance(roomName1, roomName2, continuous);
    if( roomName1 == roomName2 ) return 0;
    let posA = roomName1.split(/([NESW])/);
    let posB = roomName2.split(/([NESW])/);
    let xDif = posA[1] == posB[1] ? Math.abs(posA[2]-posB[2]) : posA[2]+posB[2]+1;
    let yDif = posA[3] == posB[3] ? Math.abs(posA[4]-posB[4]) : posA[4]+posB[4]+1;
    //if( diagonal ) return Math.max(xDif, yDif); // count diagonal as 1
    return xDif + yDif; // count diagonal as 2
};
mod.rebuildCostMatrix = function(roomName) {
    if (DEBUG) logSystem(roomName, 'Invalidating costmatrix to force a rebuild when we have vision.');
    _.set(Room, ['pathfinderCache', roomName, 'stale'], true);
    mod.pathfinderCacheDirty = true;
};
mod.loadCostMatrixCache = function(cache) {
    let count = 0;
    for (const key in cache) {
        if (!mod.pathfinderCache[key] || mod.pathfinderCache[key].updated < cache[key].updated) {
            count++;
            mod.pathfinderCache[key] = cache[key];
        }
    }
    if (DEBUG && count > 0) logSystem('RawMemory', 'loading pathfinder cache.. updated ' + count + ' stale entries.');
    mod.pathfinderCacheLoaded = true;
};
mod.getCachedStructureMatrix = function(roomName) {
    const cacheValid = (roomName) => {
        if (_.isUndefined(Room.pathfinderCache)) {
            Room.pathfinderCache = {};
            Room.pathfinderCache[roomName] = {};
            return false;
        } else if (_.isUndefined(Room.pathfinderCache[roomName])) {
            Room.pathfinderCache[roomName] = {};
            return false;
        }
        const mem = Room.pathfinderCache[roomName];
        const ttl = Game.time - mem.updated;
        if (mem.version === Room.COSTMATRIX_CACHE_VERSION && (mem.serializedMatrix || mem.costMatrix) && !mem.stale && ttl < COST_MATRIX_VALIDITY) {
            if (global.DEBUG && global.TRACE) trace('PathFinder', {roomName:roomName, ttl, PathFinder:'CostMatrix'}, 'cached costmatrix');
            return true;
        }
        return false;
    };

    const cache = Room.pathfinderCache[roomName];
    if (cache) {
        if (cache.costMatrix) {
            return {costMatrix: cache.costMatrix, valid: cacheValid(roomName)};
        } else if (cache.serializedMatrix) {
            const costMatrix = PathFinder.CostMatrix.deserialize(cache.serializedMatrix);
            cache.costMatrix = costMatrix;
            return {costMatrix, valid: cacheValid(roomName)};
        } else {
            Util.logError('Room.getCachedStructureMatrix', `Cached costmatrix for ${roomName} is invalid ${cache}`);
        }
    }
};
mod.getStructureMatrix = function(roomName, options) {
    const room = Game.rooms[roomName];
    let matrix;
    if (Room.isSKRoom(roomName) && options.avoidSK) {
        matrix = _.get(room, 'avoidSKMatrix');
    } else {
        matrix = _.get(room, 'structureMatrix');
    }

    if (!matrix) {
        matrix = _.get(Room.getCachedStructureMatrix(roomName), 'costMatrix');
    }

    return matrix;
};
mod.validFields = function(roomName, minX, maxX, minY, maxY, checkWalkable = false, where = null) {
    const room = Game.rooms[roomName];
    const look = checkWalkable ? room.lookAtArea(minY,minX,maxY,maxX) : null;
    let fields = [];
    for( let x = minX; x <= maxX; x++) {
        for( let y = minY; y <= maxY; y++){
            if( x > 1 && x < 48 && y > 1 && y < 48 ){
                if( !checkWalkable || room.isWalkable(x, y, look) ){
                    let p = new RoomPosition(x, y, roomName);
                    if( !where || where(p) )
                        fields.push(p);
                }
            }
        }
    }
    return fields;
};
// args = { spots: [{pos: RoomPosition, range:1}], checkWalkable: false, where: ()=>{}, roomName: abc ) }
mod.fieldsInRange = function(args) {
    let plusRangeX = args.spots.map(spot => spot.pos.x + spot.range);
    let plusRangeY = args.spots.map(spot => spot.pos.y + spot.range);
    let minusRangeX = args.spots.map(spot => spot.pos.x - spot.range);
    let minusRangeY = args.spots.map(spot => spot.pos.y - spot.range);
    let minX = Math.max(...minusRangeX);
    let maxX = Math.min(...plusRangeX);
    let minY = Math.max(...minusRangeY);
    let maxY = Math.min(...plusRangeY);
    return Room.validFields(args.roomName, minX, maxX, minY, maxY, args.checkWalkable, args.where);
};
mod.roomLayoutArray = [[,,,,,STRUCTURE_EXTENSION,STRUCTURE_ROAD,STRUCTURE_EXTENSION],[,,,STRUCTURE_ROAD,STRUCTURE_EXTENSION,STRUCTURE_ROAD,STRUCTURE_TOWER,STRUCTURE_ROAD,STRUCTURE_EXTENSION,STRUCTURE_ROAD],[,,STRUCTURE_ROAD,STRUCTURE_EXTENSION,STRUCTURE_ROAD,STRUCTURE_EXTENSION,STRUCTURE_SPAWN,STRUCTURE_EXTENSION,STRUCTURE_ROAD,STRUCTURE_EXTENSION,STRUCTURE_ROAD],[,STRUCTURE_ROAD,STRUCTURE_EXTENSION,STRUCTURE_EXTENSION,STRUCTURE_EXTENSION,STRUCTURE_ROAD,STRUCTURE_TOWER,STRUCTURE_ROAD,STRUCTURE_EXTENSION,STRUCTURE_EXTENSION,STRUCTURE_EXTENSION,STRUCTURE_ROAD],[,STRUCTURE_EXTENSION,STRUCTURE_ROAD,STRUCTURE_EXTENSION,STRUCTURE_EXTENSION,STRUCTURE_EXTENSION,STRUCTURE_ROAD,STRUCTURE_EXTENSION,STRUCTURE_EXTENSION,STRUCTURE_EXTENSION,STRUCTURE_ROAD,STRUCTURE_EXTENSION],[STRUCTURE_EXTENSION,STRUCTURE_ROAD,STRUCTURE_EXTENSION,STRUCTURE_ROAD,STRUCTURE_EXTENSION,STRUCTURE_ROAD,STRUCTURE_NUKER,STRUCTURE_ROAD,STRUCTURE_EXTENSION,STRUCTURE_ROAD,STRUCTURE_EXTENSION,STRUCTURE_ROAD,STRUCTURE_EXTENSION],[STRUCTURE_ROAD,STRUCTURE_TOWER,STRUCTURE_EXTENSION,STRUCTURE_SPAWN,STRUCTURE_ROAD,STRUCTURE_POWER_SPAWN,STRUCTURE_LINK,STRUCTURE_TERMINAL,STRUCTURE_ROAD,STRUCTURE_OBSERVER,STRUCTURE_EXTENSION,STRUCTURE_TOWER,STRUCTURE_ROAD],[STRUCTURE_EXTENSION,STRUCTURE_ROAD,STRUCTURE_EXTENSION,STRUCTURE_ROAD,STRUCTURE_EXTENSION,STRUCTURE_ROAD,STRUCTURE_STORAGE,STRUCTURE_ROAD,STRUCTURE_EXTENSION,STRUCTURE_ROAD,STRUCTURE_EXTENSION,STRUCTURE_ROAD,STRUCTURE_EXTENSION],[,STRUCTURE_EXTENSION,STRUCTURE_ROAD,STRUCTURE_EXTENSION,STRUCTURE_EXTENSION,STRUCTURE_EXTENSION,STRUCTURE_ROAD,STRUCTURE_EXTENSION,STRUCTURE_EXTENSION,STRUCTURE_EXTENSION,STRUCTURE_ROAD,STRUCTURE_EXTENSION],[,STRUCTURE_ROAD,STRUCTURE_EXTENSION,STRUCTURE_EXTENSION,STRUCTURE_EXTENSION,STRUCTURE_ROAD,STRUCTURE_TOWER,STRUCTURE_ROAD,STRUCTURE_EXTENSION,STRUCTURE_EXTENSION,STRUCTURE_EXTENSION,STRUCTURE_ROAD],[,,STRUCTURE_ROAD,STRUCTURE_EXTENSION,STRUCTURE_ROAD,STRUCTURE_EXTENSION,STRUCTURE_SPAWN,STRUCTURE_EXTENSION,STRUCTURE_ROAD,STRUCTURE_EXTENSION,STRUCTURE_ROAD],[,,,STRUCTURE_ROAD,STRUCTURE_EXTENSION,STRUCTURE_ROAD,STRUCTURE_TOWER,STRUCTURE_ROAD,STRUCTURE_EXTENSION,STRUCTURE_ROAD],[,,,,,STRUCTURE_EXTENSION,STRUCTURE_ROAD,STRUCTURE_EXTENSION]];
mod.roomLayout = function(flag) {
    if (!Flag.compare(flag, FLAG_COLOR.command.roomLayout)) return;
    flag = Game.flags[flag.name];
    const room = flag.room;
    if (!room) return;
    const layout = Room.roomLayoutArray;
    const constructionFlags = {
        [STRUCTURE_SPAWN]: FLAG_COLOR.construct.spawn,
        [STRUCTURE_TOWER]: FLAG_COLOR.construct.tower,
        [STRUCTURE_EXTENSION]: FLAG_COLOR.construct,
        [STRUCTURE_LINK]: FLAG_COLOR.construct.link,
        [STRUCTURE_STORAGE]: FLAG_COLOR.construct.storage,
        [STRUCTURE_TERMINAL]: FLAG_COLOR.construct.terminal,
        [STRUCTURE_NUKER]: FLAG_COLOR.construct.nuker,
        [STRUCTURE_POWER_SPAWN]: FLAG_COLOR.construct.powerSpawn,
        [STRUCTURE_OBSERVER]: FLAG_COLOR.construct.observer,
    };

    const [centerX, centerY] = [flag.pos.x, flag.pos.y];

    const placed = [];
    const sites = [];

    const failed = () => {
        flag.pos.newFlag(FLAG_COLOR.command.invalidPosition, 'NO_ROOM');
        flag.remove();
        return false;
    };

    for (let x = 0; x < layout.length; x++) {
        for (let y = 0; y < layout[x].length; y++) {
            const xPos = Math.floor(centerX + (x - layout.length / 2) + 1);
            const yPos = Math.floor(centerY + (y - layout.length / 2) + 1);
            if (xPos >= 50 || xPos < 0 || yPos >= 50 || yPos < 0) return failed();
            const pos = room.getPositionAt(xPos, yPos);
            const structureType = layout[x] && layout[x][y];
            if (structureType) {
                if (Game.map.getTerrainAt(pos) === 'wall') return failed();
                if (structureType === STRUCTURE_ROAD) {
                    sites.push(pos);
                } else {
                    const flagColour = constructionFlags[structureType];
                    placed.push({
                        flagColour, pos
                    });
                }
            }
        }
    }

    placed.forEach(f => {
        f.pos.newFlag(f.flagColour);
    });
    _.forEach(sites, p => {
        if (_.size(Game.constructionSites) >= 100) return false;
        p.createConstructionSite(STRUCTURE_ROAD);
    });

    flag.remove();
};
