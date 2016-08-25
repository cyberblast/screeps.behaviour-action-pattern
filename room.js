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
                        var addSource = id => { AddById(this._sources, id); };
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
                    if( _.isUndefined(this.memory.spawns) || Game.time % MEMORY_RESYNC_INTERVAL == 0 ) {
                        this.memory.spawns = [];
                        let spawns = this.find(FIND_MY_SPAWNS);
                        if( spawns.length > 0 ){
                            var spawnId = spawn => spawn.id;
                            this.memory.spawns = _.map(spawns, spawnId);
                        } else this.memory.spawns = [];
                    }
                    if( _.isUndefined(this._spawns) ){ 
                        this._spawns = [];
                        var addSpawn = id => { AddById(this._spawns, id); };
                        _.forEach(this.memory.spawns, addSpawn);
                    }
                    return this._spawns;
                }
            },
            'towers': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this.memory.towers) || Game.time % MEMORY_RESYNC_INTERVAL == 0 ) {
                        this.memory.towers = [];
                        let towers = this.find(FIND_MY_STRUCTURES, {
                            filter: {structureType: STRUCTURE_TOWER}
                        });
                        if( towers.length > 0 ){
                            var id = obj => obj.id;
                            this.memory.towers = _.map(towers, id);
                        } else this.memory.towers = [];
                    }
                    if( _.isUndefined(this._towers) ){ 
                        this._towers = [];
                        var add = id => { AddById(this._towers, id); };
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
                                (structure.structureType != STRUCTURE_ROAD || structure.hitsMax - structure.hits > GAP_REPAIR_DECAYABLE ) && 
                                (structure.towers === undefined || structure.towers.length == 0)) }) , 
                            'hits'
                        );
                    }
                    return this._repairableSites;
                }
            },
            'fuelables': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._fuelables) ){
                        var self = this; 
                        var factor = self.situation.invasion ? 1 : (1-(0.18/self.towers.length));
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
                        this._maxPerJob = _.max([1,(this.population && this.population.worker ? this.population.worker.count : 0)/3.1]);
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
        Room.prototype.loop = function(){
            var self = this;               
            try {
                if( this.memory.hostileIds === undefined )
                    this.memory.hostileIds = [];
                if( this.memory.statistics === undefined)
                    this.memory.statistics = {};

                if( this.controller && this.controller.my ) {
                    var registerHostile = creep => {
                        if( !self.memory.hostileIds.includes(creep.id) ){
                            var bodyCount = JSON.stringify( _.countBy(creep.body, 'type') );
                            if( creep.owner.username != 'Invader' ){
                                var message = 'Hostile intruder ' + creep.id + ' (' + bodyCount + ') from "' + creep.owner.username + '" in room ' + self.name + ' at ' + DateTimeString(LocalDate(new Date()));
                                Game.notify(message);
                                console.log(message);
                            }
                            if(self.memory.statistics.invaders === undefined)
                                self.memory.statistics.invaders = [];
                            self.memory.statistics.invaders.push({
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
                        if( !self.hostileIds.includes(id) && self.memory.statistics && self.memory.statistics.invaders !== undefined && self.memory.statistics.invaders.length > 0){
                            var select = invader => invader.id == id && invader.leave === undefined;
                            var entry = _.find(self.memory.statistics.invaders, select);
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