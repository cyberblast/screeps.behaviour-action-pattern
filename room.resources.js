const mod = {};
module.exports = mod;
mod.extend = function() {
    Object.defineProperties(Room.prototype, {
        'droppedResources': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._droppedResources) ){
                    this._droppedResources = this.find(FIND_DROPPED_RESOURCES);
                }
                return this._droppedResources;
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
    });
    Object.defineProperties(Room.prototype, {
        'minerals': {
            configurable:true,
            get: function () {
                if( _.isUndefined(this.memory.minerals)) {
                    this.saveMinerals();
                }
                if( _.isUndefined(this._minerals) ){
                    this._minerals = [];
                    let add = id => { addById(this._minerals, id); };
                    this.memory.minerals.forEach(add);
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
    });
    Room.prototype.saveMinerals = function() {
        let that = this;
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
        this._minerals = this.find(FIND_MINERALS).filter(hasExtractor);
        if( this._minerals.length > 0 ){
            let id = o => o.id;
            this.memory.minerals = _.map(that._minerals, id);
        } else this.memory.minerals = [];
    };
};
mod.analyze = function() {
    if( Game.time % MEMORY_RESYNC_INTERVAL === 0 || room.name == 'sim' ) room.saveMinerals();
};
mod.flush = function() {
    if (global.isNewServer) delete room._minerals;
    delete room._reservedSpawnEnergy;
    delete room._sourceEnergyAvailable;
    delete room._droppedResources;
    delete room._ticksToNextRegeneration;
    delete room._relativeEnergyAvailable;
};