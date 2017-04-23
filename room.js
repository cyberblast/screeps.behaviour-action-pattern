// save original API functions
let find = Room.prototype.find;

let mod = {};
module.exports = mod;
mod.register = function() {
    // run register in each of our submodules
    for (const key of Object.keys(Room._ext)) {
        if (Room._ext[key].register) Room._ext[key].register();
    }
    Room.costMatrixInvalid.on(room => Room.rebuildCostMatrix(room.name || room));
};
Room.pathfinderCache = {};
Room.pathfinderCacheDirty = false;
Room.pathfinderCacheLoaded = false;
Room.COSTMATRIX_CACHE_VERSION = 3; // change this to invalidate previously cached costmatrices
mod.extend = function(){
    // run extend in each of our submodules
    for (const key of Object.keys(Room._ext)) {
        if (Room._ext[key].extend) Room._ext[key].extend();
    }

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
            'feedable': {
                configurable: true,
                get: function() {
                    if (_.isUndefined(this._feedable)) {
                        this._feedable = this.extensions.concat(this.spawns);
                    }
                    return this._feedable;
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
                        this._container = new Room.Containers(this.room);
                    }
                    return this._container;
                }
            },
            'links' : {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._links) ){
                        this._links = new Room.Links(this.room);
                    }
                    return this._links;
                }
            },
            'labs' : {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._labs) ){
                        this._labs = new Room.Labs(this.room);
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
                        this._nukers = new Room.Nuker(this.room);
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
                        this._powerSpawns = new Room.PowerSpawn(this.room);
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
        'relativeEnergyAvailable': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._relativeEnergyAvailable) ){
                    this._relativeEnergyAvailable = this.energyCapacityAvailable > 0 ? this.energyAvailable / this.energyCapacityAvailable : 0;
                }
                return this._relativeEnergyAvailable;
            }
        },
        'relativeRemainingEnergyAvailable': {
            configurable: true,
            get: function() {
                return this.energyCapacityAvailable > 0 ? this.remainingEnergyAvailable / this.energyCapacityAvailable : 0;
            }
        },
        'remainingEnergyAvailable': {
            configurable: true,
            get: function() {
                return this.energyAvailable - this.reservedSpawnEnergy;
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
                this._reservedSpawnEnergy = value;
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
        'structureMatrix': {
            configurable: true,
            get: function () {
                if (_.isUndefined(this._structureMatrix)) {
                    const cached = Room.getCachedStructureMatrix(this.name);
                    if (cached && cached.valid) {
                        this._structureMatrix = cached.costMatrix;
                    } else {
                        if (global.DEBUG) logSystem(this.name, 'Calculating cost matrix');
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
                        const prevTime = _.get(Room.pathfinderCache, [this.name, 'updated']);
                        Room.pathfinderCache[this.name] = {
                            costMatrix: costMatrix,
                            updated: Game.time,
                            version: Room.COSTMATRIX_CACHE_VERSION
                        };
                        Room.pathfinderCacheDirty = true;
                        if( global.DEBUG && global.TRACE ) trace('PathFinder', {roomName:this.name, prevTime, structures:this.structures.all.length, PathFinder:'CostMatrix'}, 'updated costmatrix');
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
            // these are vital for feeding
            this.saveExtensions();
            this.saveSpawns();
        }
        if (numStructures > 0) this.memory.myTotalStructures = numStructures;
        else delete this.memory.myTotalStructures;
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
    Room.prototype.invalidateCostMatrix = function() {
        Room.costMatrixInvalid.trigger(this.name);
    };
    
    Room.prototype.highwayHasWalls = function() {
        if (!Room.isHighwayRoom(this.name)) return false;
        return !!_.find(this.getPositionAt(25, 25).lookFor(LOOK_STRUCTURES), s => s instanceof StructureWall);
    };
    Room.prototype.isTargetAccessible = function(object, target) {
        if (!object || !target) return;
        // Checks. Accept RoomObject, RoomPosition, and mock position
        if (object instanceof RoomObject) object = object.pos;
        if (target instanceof RoomObject) target = target.pos;
        for (const prop of ['x', 'y', 'roomName']) {
            if (!Reflect.has(object, prop) || !Reflect.has(target, prop)) return;
        }
        
        if (!Room.isHighwayRoom(this.name)) return;
        if (!this.highwayHasWalls()) return true;
        
        const [x, y] = Room.calcCoordinates(this.name, (x, y) => [x, y]);
        
        const getVerHalf = o => Math.floor(o.x / 25) === 0 ? LEFT : RIGHT;
        
        const getHorHalf = o => Math.floor(o.y / 25) === 0 ? TOP : BOTTOM;
        
        const getQuadrant = o => {
            const verHalf = getVerHalf(o);
            const horHalf = getHorHalf(o);
            if (verHalf === LEFT) {
                return horHalf === TOP ? TOP_LEFT : BOTTOM_LEFT;
            } else {
                return horHalf === TOP ? TOP_RIGHT : BOTTOM_RIGHT;
            }
        };
        
        if (x % 10 === 0) {
            if (y % 10 === 0) { // corner room
                
                const top = !!_.find(this.getPositionAt(25, 24).lookFor(LOOK_STRUCTURES), s => s instanceof StructureWall);
                const left = !!_.find(this.getPositionAt(24, 25).lookFor(LOOK_STRUCTURES, s => s instanceof StructureWall));
                const bottom = !!_.find(this.getPositionAt(25, 26).lookFor(LOOK_STRUCTURES, s => s instanceof StructureWall));
                const right = !!_.find(this.getPositionAt(26, 25).lookFor(LOOK_STRUCTURES, s => s instanceof StructureWall));
                
                // both in same quadrant
                if (getQuadrant(object) === getQuadrant(target)) return true;
                
                if (top && left && bottom && right) {
                    // https://i.imgur.com/8lmqtbi.png
                    return getQuadrant(object) === getQuadrant(target);
                }
                
                if (top) {
                    if (bottom) {
                        // cross section
                        if (left) {
                            return Util.areEqual(RIGHT, getVerHalf(object), getVerHalf(target));
                        } else {
                            return Util.areEqual(LEFT, getVerHalf(object), getVerHalf(target));
                        }
                    }
                    if (left && right) {
                        // cross section
                        if (getHorHalf(object) !== getHorHalf(target)) return false;
                        return Util.areEqual(BOTTOM, getHorHalf(object), getHorHalf(target));
                    }
                    if (Util.areEqual(BOTTOM, getHorHalf(object), getHorHalf(target))) return true;
                    if (left) {
                        if (Util.areEqual(RIGHT, getVerHalf(object), getVerHalf(target))) return true;
                        if (getQuadrant(object) === TOP_LEFT && getQuadrant(target) !== TOP_LEFT) return false;
                    } else {
                        if (Util.areEqual(LEFT, getVerHalf(object), getVerHalf(target))) return true;
                        if (getQuadrant(object) === TOP_RIGHT && getQuadrant(target) !== TOP_RIGHT) return false;
                    }
                } else {
                    if (left && right) {
                        // cross section
                        if (getHorHalf(object) !== getHorHalf(target)) return false;
                        return Util.areEqual(TOP, getHorHalf(object), getHorHalf(target));
                    }
                    if (Util.areEqual(TOP, getHorHalf(object), getHorHalf(target))) return true;
                    if (left) {
                        if (Util.areEqual(RIGHT, getVerHalf(object), getVerHalf(target))) return true;
                        if (getQuadrant(object) === BOTTOM_LEFT && getQuadrant(target) !== BOTTOM_LEFT) return false;
                    } else {
                        if (Util.areEqual(LEFT, getVerHalf(object), getVerHalf(target))) return true;
                        if (getQuadrant(object) === BOTTOM_RIGHT && getQuadrant(target) !== BOTTOM_RIGHT) return false;
                    }
                }
                return true;
            }
            if (getVerHalf(object) === getVerHalf(target)) return true;
        }
        if (y % 10 === 0) {
            if (getHorHalf(object) === getHorHalf(target)) return true;
        }
        return true;
    };
    Room.prototype.targetAccessible = function(target) {
        if (!target) return;
        if (target instanceof RoomObject) target = target.pos;
        for (const prop of ['x', 'y', 'roomName']) {
            if (!Reflect.has(target, prop)) return;
        }
        
        if (!Room.isHighwayRoom(this.name)) return;
        if (!this.highwayHasWalls()) return true;
        
        const closestRoom = _(Game.rooms).filter('my').min(r => Game.map.getRoomLinearDistance(r.name, this.name));
        if (closestRoom === Infinity) return;
        
        const [x1, y1] = Room.calcGlobalCoordinates(this.name, (x, y) => [x, y]);
        const [x2, y2] = Room.calcGlobalCoordinates(closestRoom, (x, y) => [x, y]);
        let dir = '';
        if (y1 - y2 < 0) {
            dir += 'south';
        } else if (y1 - y2 > 0) {
            dir += 'north';
        }
        if (x1 - x2 < 0) {
            dir += 'east';
        } else if (x1 - x2 > 0) {
            dir += 'west';
        }
        if (x1 % 10 === 0) {
            if (y1 % 10 === 0) {
                // corner room
                if (dir.includes('south') && dir.includes('east')) {
                    return this.isTargetAccessible(this.getPositionAt(49, 49), target);
                }
                if (dir.includes('south') && dir.includes('west')) {
                    return this.isTargetAccessible(this.getPositionAt(0, 49), target);
                }
                if (dir.includes('north') && dir.includes('east')) {
                    return this.isTargetAccessible(this.getPositionAt(49, 0), target);
                }
                if (dir.includes('north') && dir.includes('west')) {
                    return this.isTargetAccessible(this.getPositionAt(0, 0), target);
                }
            }
            if (dir.includes('east')) {
                return this.isTargetAccessible(this.getPositionAt(49, 25), target);
            }
            if (dir.includes('west')) {
                return this.isTargetAccessible(this.getPositionAt(0, 25), target);
            }
        }
        if (y1 % 10 === 0) {
            if (dir.includes('south')) {
                return this.isTargetAccessible(this.getPositionAt(25, 49), target);
            }
            if (dir.includes('north')) {
                return this.isTargetAccessible(this.getPositionAt(25, 0), target);
            }
        }
        return true;
    };
};
mod.flush = function(){
    // run flush in each of our submodules
    for (const key of Object.keys(Room._ext)) {
        if (Room._ext[key].flush) Room._ext[key].flush();
    }
    let clean = room => {
        for (const key of Object.keys(Room._ext)) {
            if (Room._ext[key].flushRoom) Room._ext[key].flushRoom(room);
        }
    };
    _.forEach(Game.rooms, clean);
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
mod.needMemoryResync = function(room) {
    if (_.isUndefined(room.memory.initialized)) {
        room.memory.initialized = Game.time;
        return true;
    }
    return Game.time % global.MEMORY_RESYNC_INTERVAL === 0 || room.name == 'sim';
};
mod.analyze = function() {
    const p = Util.startProfiling('Room.analyze', {enabled:PROFILING.ROOMS});
    // run analyze in each of our submodules
    for (const key of Object.keys(Room._ext)) {
        if (Room._ext[key].analyze) Room._ext[key].analyze();
    }
    const totalSitesChanged = Room.totalSitesChanged();
    const totalStructuresChanged = Room.totalStructuresChanged();
    const getEnvironment = room => {
        try {
            const needMemoryResync = Room.needMemoryResync(room);
            // run analyzeRoom in each of our submodules
            for (const key of Object.keys(Room._ext)) {
                if (Room._ext[key].analyzeRoom) Room._ext[key].analyzeRoom(room, needMemoryResync);
            }
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
    // run execute in each of our submodules
    for (const key of Object.keys(Room._ext)) {
        if (Room._ext[key].execute) Room._ext[key].execute();
    }
    let run = (memory, roomName) => {
        try {
            // run executeRoom in each of our submodules
            for (const key of Object.keys(Room._ext)) {
                if (Room._ext[key].executeRoom) Room._ext[key].executeRoom(memory, roomName);
            }
            const room = Game.rooms[roomName];
            if (room) { // has sight
                if (room.collapsed) {
                    const p2 = Util.startProfiling(roomName + 'execute', {enabled:PROFILING.ROOMS});
                    Room.collapsed.trigger(room);
                    p2.checkCPU('collapsed', 0.5);
                }
            }
        } catch (e) {
            Util.logError(e.stack || e.message);
        }
    };
    _.forEach(Memory.rooms, (memory, roomName) => {
        run(memory, roomName);
        p.checkCPU(roomName + '.run', 1);
    });
};
mod.cleanup = function() {
    // run cleanup in each of our submodules
    for (const key of Object.keys(Room._ext)) {
        if (Room._ext[key].cleanup) Room._ext[key].cleanup();
    }
    // flush changes to the pathfinderCache but wait until load
    if (!_.isUndefined(Memory.pathfinder)) {
        OCSMemory.saveSegment(MEM_SEGMENTS.COSTMATRIX_CACHE, Memory.pathfinder);
        delete Memory.pathfinder;
    }
    if (Room.pathfinderCacheDirty && Room.pathfinderCacheLoaded) {
        // store our updated cache in the memory segment
        let encodedCache = {};
        for (const key in Room.pathfinderCache) {
            const entry = Room.pathfinderCache[key];
            if (entry.version === Room.COSTMATRIX_CACHE_VERSION) {
                encodedCache[key] = {
                    serializedMatrix: entry.serializedMatrix || entry.costMatrix.serialize(),
                    updated: entry.updated,
                    version: entry.version
                };
            }
        }
        OCSMemory.saveSegment(MEM_SEGMENTS.COSTMATRIX_CACHE, encodedCache);
        Room.pathfinderCacheDirty = false;
    }
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
    if (global.DEBUG) logSystem(roomName, 'Removing invalid costmatrix to force a rebuild.')
    Room.pathfinderCache[roomName] = {};
    Room.pathfinderCacheDirty = true;
};
mod.loadCostMatrixCache = function(cache) {
    let count = 0;
    for (const key in cache) {
        if (!Room.pathfinderCache[key] || Room.pathfinderCache[key].updated < cache[key].updated) {
            count++;
            Room.pathfinderCache[key] = cache[key];
        }
    }
    if (global.DEBUG && count > 0) logSystem('RawMemory', 'loading pathfinder cache.. updated ' + count + ' stale entries.');
    Room.pathfinderCacheLoaded = true;
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
        if (mem.version === Room.COSTMATRIX_CACHE_VERSION && (mem.serializedMatrix || mem.costMatrix) && ttl < COST_MATRIX_VALIDITY) {
            if (global.DEBUG && global.TRACE) trace('PathFinder', {roomName:roomName, ttl, PathFinder:'CostMatrix'}, 'cached costmatrix');
            return true;
        }
        return false;
    };

    const cache = Room.pathfinderCache[roomName];
    if (cache) {
        if (cache.costMatrix) {
            return {costMatrix: cache.costMatrix, valid: cacheValid(roomName)};
        } else {
            const costMatrix = PathFinder.CostMatrix.deserialize(cache.serializedMatrix);
            cache.costMatrix = costMatrix;
            return {costMatrix, valid: cacheValid(roomName)};
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
