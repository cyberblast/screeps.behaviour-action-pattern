const mod = {};
module.exports = mod;
mod.constructor = function(room) {
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
        'spawns': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this.room.memory.spawns) ) {
                    this.room.saveSpawns();
                }
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
                if( _.isUndefined(this.room.memory.towers)) {
                    this.room.saveTowers();
                }
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
                    this._container = new Room.Containers.constructor(this.room);
                }
                return this._container;
            }
        },
        'links' : {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._links) ){
                    this._links = new Room.Links.constructor(this.room);
                }
                return this._links;
            }
        },
        'labs' : {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._labs) ){
                    this._labs = new Room.Labs.constructor(this.room);
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
                    this._piles = room.find(FIND_FLAGS, {filter: FLAG_COLOR.command.drop.filter})
                        .map(function(flag) {
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
                if (_.isUndefined(this.room.memory.observer)) {
                    this.room.saveObserver();
                }
                if (_.isUndefined(this._observer)) {
                    this._observer = Game.getObjectById(this.room.memory.observer.id);
                }
                return this._observer;
            },
        },
        'nuker': {
            configurable: true,
            get: function() {
                if (_.isUndefined(this.room.memory.nukers)) {
                    this.room.saveNukers();
                }
                if (_.isUndefined(this._nuker)) {
                    if (this.room.memory.nukers.length > 0) {
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
                    this._nukers = new Room.Nukers.constructor(this.room);
                }
                return this._nukers;
            }
        },
        'powerSpawn': {
            configurable: true,
            get: function() {
                if (_.isUndefined(this.room.memory.powerSpawns)) {
                    this.room.savePowerSpawns();
                }
                if (_.isUndefined(this._powerSpawn)) {
                    if (this.room.memory.powerSpawns.length > 0) {
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
                    this._powerSpawns = new Room.PowerSpawns.constructor(this.room);
                }
                return this._powerSpawns;
            }
        },
    });
};
mod.extend = function() {
    Object.defineProperties(Room.prototype, {
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
        'structures': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._structures) ){
                    this._structures = new mod.constructor(this);
                }
                return this._structures;
            }
        }
    });
    Room.prototype.getBestConstructionSiteFor = function(pos, filter = null) {
        let sites;
        if( filter ) sites = this.constructionSites.filter(filter);
        else sites = this.constructionSites;
        if( sites.length == 0 ) return null;
        let siteOrder = CONSTRUCTION_PRIORITY;
        let rangeOrder = site => {
            let order = siteOrder.indexOf(site.structureType);
            return pos.getRangeTo(site) + ( order < 0 ? 100000 : (order * 100) );
            //if( order < 0 ) return 100000 + pos.getRangeTo(site);
            //return ((order - (site.progress / site.progressTotal)) * 100) + pos.getRangeTo(site);
        };
        return _.min(sites, rangeOrder);
    };
};
mod.analyze = function(room) {

};
mod.flush = function(room) {
    if( global.isNewServer ) {
        delete room._constructionSites;
        delete room._myConstructionSites;
        delete room._structures;
    } else {
        delete room.structures._repairable;
        delete room.structures._urgentRepairableSites;
        delete room.structures._fortifyableSites;
        delete room.structures._fuelables;
    }
};