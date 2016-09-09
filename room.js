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
                        let siteOrder = [STRUCTURE_EXTENSION,STRUCTURE_STORAGE,STRUCTURE_ROAD];
                        let getOrder = site => {let o = siteOrder.indexOf(site); return o < 0 ? 100 : o;};
                        this._constructionSites.sort( (a, b) => {return getOrder(a.structureType) - getOrder(b.structureType);} );
                    }
                    return this._constructionSites;
                }
            },
            'repairableSites': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._repairableSites) ){ 
                        let that = this;
                        this._repairableSites = _.sortBy(that.find(FIND_STRUCTURES, {
                            filter: (structure) => (
                                structure.hits < structure.hitsMax && 
                                (!that.controller || !that.controller.my || structure.hits < MAX_REPAIR_LIMIT[that.controller.level] ) && 
                                ( !DECAYABLES.includes(structure.structureType) || (structure.hitsMax - structure.hits) > GAP_REPAIR_DECAYABLE ) && 
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
                        var factor = that.situation.invasion ? 1 : 0.82;
                        var fuelable = target => (target.energy < (target.energyCapacity * factor));
                        this._fuelables = _.sortBy( _.filter(this.towers, fuelable), 'energy') ; // TODO: Add Nuker
                    }
                    return this._fuelables;
                }
            },
            'urgentRepairableSites': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._urgentRepairableSites) ){ 
                        var isUrgent = site => (site.hits < LIMIT_URGENT_REPAIRING || 
                            (site.structureType === 'container' && site.hits < LIMIT_URGENT_REPAIRING * 15)); 
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
            },
            'routePlaner': {
                configurable: true,
                get: function () {
                    if (_.isUndefined(this.memory.routePlaner) ) {
                        this.memory.routePlaner = {
                            'data':{},
                        }
                    }
                    return this.memory.routePlaner;
                }
            },

        });

        Room.prototype.roadTick = function( minDeviation = ROUTEPLANNER_MIN_DEVIATION) {
            let data = Object.keys(this.routePlaner.data)
                .map( k => { 
                    return { // convert to [{key,n,x,y}]
                        'n': this.routePlaner.data[k], // count of steps on x,y cordinates
                        'x': k.charCodeAt(0)-32, // extract x from key
                        'y': k.charCodeAt(1)-32 // extraxt y from key
                    };
                });
                
            let min = (data.reduce( (_sum, b) => _sum + b.n, 0 ) / data.length) * minDeviation;
                            
            data = data.filter( e => {
                return e.n > min && 
                    this.lookForAt(LOOK_STRUCTURES,e.x,e.y).length == 0 &&
                    this.lookForAt(LOOK_CONSTRUCTION_SITES,e.x,e.y).length == 0;
            });
            
            // build roads on all most frequent used fields
            let setSite = pos => {
                if( DEBUG ) console.log(`Constructing new road in ${this.name} at ${pos.x}'${pos.y} (${pos.n} traces)`);
                this.createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD);
            };
            _.forEach(data, setSite);

            // clear old data
            this.routePlaner.data = {};
        };

        Room.prototype.recordMove = function(creep){
            let x = creep.pos.x;
            let y = creep.pos.y;
            if ( x == 0 || y == 0 || x == 49 || y == 49 || 
                creep.carry.energy == 0 || creep.data.actionName == 'building' ) 
                return;

            const cord = `${String.fromCharCode(32+x)}${String.fromCharCode(32+y)}_x${x}-y${y}`;

            if( !this.routePlaner.data[cord] )
                this.routePlaner.data[cord]=0;

            this.routePlaner.data[cord] = this.routePlaner.data[cord] + 1;
        };

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
                filter: (structure) => ( structure.structureType == STRUCTURE_CONTAINER )
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

                if( Game.time % ROUTE_PLANNER_INTERVAL == 0 && !this.constructionSites.find(c=> c.structureType == STRUCTURE_ROAD))
                {
                    this.roadTick();
                }

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
