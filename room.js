var mod = {
    extend: function(){
        Object.defineProperties(Room.prototype, {
            'sources': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this.memory.sourceIds) ) {
                        this.memory.sourceIds = [];
                        let sources = this.find(FIND_SOURCES);
                        if( sources.length > 0 ){
                            var byAccess = source => source.accessibleFields;
                            var sourceId = source => source.id;
                            this.memory.sourceIds = _.map(_.sortBy(sources, byAccess), sourceId);
                        } else this.memory.sourceIds = [];
                    }
                    if( _.isUndefined(this._sources) ){  
                        this._sources = [];
                        var addSource = id => { addById(this._sources, id); };
                        _.forEach(this.memory.sourceIds, addSource);
                    }
                    return this._sources;
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
            'spawns': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this.memory.spawns) ) {
                        this.saveSpawns();
                    }
                    if( _.isUndefined(this._spawns) ){ 
                        this._spawns = [];
                        var addSpawn = id => { addById(this._spawns, id); };
                        _.forEach(this.memory.spawns, addSpawn);
                    }
                    return this._spawns;
                }
            },
            'towers': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this.memory.towers)) {
                        this.saveTowers();
                    }
                    if( _.isUndefined(this._towers) ){ 
                        this._towers = [];
                        var add = id => { addById(this._towers, id); };
                        _.forEach(this.memory.towers, add);
                    }
                    return this._towers;
                }
            },
            'towerFreeCapacity': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._towerFreeCapacity) ) { 
                        this._towerFreeCapacity = 0;
                        var addFreeCapacity = tower => this._towerFreeCapacity += (tower.energyCapacity - tower.energy);
                        _.forEach(this.towers, addFreeCapacity);
                    }
                    return this._towerFreeCapacity;
                }
            },
            'constructionSites': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._constructionSites) ){ 
                        this._constructionSites = this.find(FIND_MY_CONSTRUCTION_SITES); 
                    }
                    return this._constructionSites;
                }
            },
            'repairableSites': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._repairableSites) ){ 
                        this._repairableSites = _.sortBy(this.find(FIND_STRUCTURES, {
                            filter: (structure) => (
                                structure.hits < structure.hitsMax && 
                                structure.hits < TOWER_REPAIR_LIMITS[this.controller.level] && 
                                ( ![STRUCTURE_ROAD, STRUCTURE_CONTAINER].includes(structure.structureType) || structure.hitsMax - structure.hits > GAP_REPAIR_DECAYABLE ) && 
                                (structure.towers === undefined || structure.towers.length == 0)) }) , 
                            'hits'
                        );
                    }
                    return this._repairableSites;
                }
            },
            'chargeables': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this.memory.chargeables)) {
                        this.saveChargeables();
                    }
                    if( _.isUndefined(this._chargeables) ){ 
                        this._chargeables = [];
                        let add = id => { addById(this._chargeables, id); };
                        _.forEach(this.memory.chargeables, add);
                        let categorize = c => {
                            let s = c.pos.findInRange(this.sources, 3);
                            c.chargeableType = s.length > 0 ? 'IN' : 'OUT';
                        };
                        _.forEach(this._chargeables, categorize);
                    }
                    return this._chargeables;
                }
            },
            'chargeablesIn': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._chargeablesIn) ){ 
                        let byType = c => c.chargeableType == 'IN';
                        this._chargeablesIn = _.filter(this.chargeables, byType);
                    }
                    return this._chargeablesIn;
                }
            },
            'chargeablesOut': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._chargeablesOut) ){ 
                        let byType = c => c.chargeableType == 'OUT';
                        this._chargeablesOut = _.filter(this.chargeables, byType);
                    }
                    return this._chargeablesOut;
                }
            },
            'fuelables': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._fuelables) ){
                        var that = this; 
                        var factor = that.situation.invasion ? 1 : (1-(0.18/that.towers.length));
                        var fuelable = target => (target.energy < (target.energyCapacity * factor));
                        this._fuelables = _.filter(this.towers, fuelable); // TODO: Add Nuker
                    }
                    return this._fuelables;
                }
            },
            'urgentRepairableSites': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._urgentRepairableSites) ){ 
                        var isUrgent = site => site.hits < LIMIT_URGENT_REPAIRING;
                        this._urgentRepairableSites = _.filter(this.repairableSites, isUrgent);
                    }
                    return this._urgentRepairableSites;
                }
            }, 
            'hostiles': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._hostiles) ){ 
                        this._hostiles = this.find(FIND_HOSTILE_CREEPS);
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
            'situation': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._situation) ){ 
                        this._situation = {
                            noEnergy: this.sourceEnergyAvailable == 0, 
                            invasion: this.hostiles.length > 0
                        }
                    }
                    return this._situation;
                }
            },
            'maxPerJob': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._maxPerJob) ){ 
                        this._maxPerJob = _.max([1,(this.population && this.population.typeCount.worker ? this.population.typeCount.worker : 0)/3.5]);
                    }
                    return this._maxPerJob;
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
            }
        });

        Room.prototype.saveTowers = function(){
            let towers = this.find(FIND_MY_STRUCTURES, {
                filter: {structureType: STRUCTURE_TOWER}
            });
            if( towers.length > 0 ){
                var id = obj => obj.id;
                this.memory.towers = _.map(towers, id);
            } else this.memory.towers = [];
        };            
        Room.prototype.saveSpawns = function(){
            let spawns = this.find(FIND_MY_SPAWNS);
            if( spawns.length > 0 ){
                var spawnId = spawn => spawn.id;
                this.memory.spawns = _.map(spawns, spawnId);
            } else this.memory.spawns = [];
        };
        Room.prototype.saveChargeables = function(){
            let chargeables = this.find(FIND_STRUCTURES, {
                filter: (structure) => (
                    structure.structureType == STRUCTURE_CONTAINER ||
                    structure.structureType == STRUCTURE_LINK)
            });
            if( chargeables.length > 0 ){
                var id = obj => obj.id;
                this.memory.chargeables = _.map(chargeables, id);
            } else this.memory.chargeables = [];
        };

        Room.prototype.loop = function(){
            delete this._sourceEnergyAvailable;
            delete this._ticksToNextRegeneration;
            delete this._relativeEnergyAvailable;
            delete this._towerFreeCapacity;
            delete this._constructionSites;
            delete this._repairableSites;
            delete this._fuelables;
            delete this._urgentRepairableSites;
            delete this._hostiles;
            delete this._hostileIds;
            delete this._situation;
            delete this._maxPerJob;
            delete this._creeps
            delete this._casualties;
            delete this._chargeables;

            if( Game.time % MEMORY_RESYNC_INTERVAL == 0 ) {
                this.saveTowers();
                this.saveSpawns();
                this.saveChargeables();
            }

            var that = this;               
            try {
                if( this.memory.hostileIds === undefined )
                    this.memory.hostileIds = [];
                if( this.memory.statistics === undefined)
                    this.memory.statistics = {};

                if( this.controller && this.controller.my ) {
                    var registerHostile = creep => {
                        if( !that.memory.hostileIds.includes(creep.id) ){
                            var bodyCount = JSON.stringify( _.countBy(creep.body, 'type') );
                            if( creep.owner.username != 'Invader' ){
                                var message = 'Hostile intruder ' + creep.id + ' (' + bodyCount + ') from "' + creep.owner.username + '" in room ' + that.name + ' at ' + toDateTimeString(toLocalDate(new Date()));
                                Game.notify(message);
                                console.log(message);
                            }
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
                    _.forEach(this.hostiles, registerHostile);
                    
                    var registerHostileLeave = id => {
                        if( !that.hostileIds.includes(id) && that.memory.statistics && that.memory.statistics.invaders !== undefined && that.memory.statistics.invaders.length > 0){
                            var select = invader => invader.id == id && invader.leave === undefined;
                            var entry = _.find(that.memory.statistics.invaders, select);
                            if( entry != undefined ) entry.leave = Game.time;
                        }
                    }
                    _.forEach(this.memory.hostileIds, registerHostileLeave);
                }
            }
            catch(err) {
                Game.notify('Error in room.js (Room.prototype.loop): ' + err);
                console.log('Error in room.js (Room.prototype.loop): ' + err);
            }
            this.memory.hostileIds = this.hostileIds;            
        };
    }
}

module.exports = mod;