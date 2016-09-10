var mod = {
    extend: function(){
        Object.defineProperties(Room.prototype, {
            'sources': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this.memory.sources) ) {
                        this.memory.sources = [];
                        let sources = this.find(FIND_SOURCES);
                        if( sources.length > 0 ){
                            let add = source => {
                                this.memory.sources.push({
                                    id: source.id
                                });
                            };
                            sources.forEach(add);
                        };
                    }
                    if( _.isUndefined(this._sources) ){  
                        this._sources = [];
                        var addSource = entry => { addById(this._sources, entry.id); };
                        _.forEach(this.memory.sources, addSource);
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
            'container': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this.memory.container)) {
                        this.saveContainers();
                    }
                    if( _.isUndefined(this._container) ){ 
                        this._container = [];
                        let add = entry => {
                            let cont = Game.getObjectById(entry.id); 
                            if( cont ) {
                                _.assign(cont, entry);
                                this._container.push(cont);
                            }
                        };
                        _.forEach(this.memory.container, add);
                    }
                    return this._container;
                }
            },
            // miners go to
            'containerSource': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._containerSource) ){ 
                        let byType = c => c.source === true;
                        this._containerSource = _.filter(this.container, byType);
                    }
                    return this._containerSource;
                }
            },
            // upgraders go to
            'containerController': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._containerController) ){ 
                        let byType = c => c.controller == true;
                        this._containerController = _.filter(this.container, byType);
                    }
                    return this._containerController;
                }
            },
            'containerIn': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._containerIn) ){ 
                        let byType = c => c.source === true && c.controller == false;
                        this._containerIn = _.filter(this.container, byType);
                        // add managed                         
                        let isFull = c => _.sum(target.store) >= (target.storeCapacity * (1-MANAGED_CONTAINER_TRIGGER));
                        this._containerIn.concat(this.containerManaged.filter(isFull));
                        
                    }
                    return this._containerIn;
                }
            },
            'containerOut': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._containerOut) ){ 
                        let byType = c => c.source === false;
                        this._containerOut = _.filter(this.container, byType);
                        // add managed                         
                        let isEmpty = c => _.sum(target.store) <= (target.storeCapacity * MANAGED_CONTAINER_TRIGGER);
                        this._containerOut.concat(this.containerManaged.filter(isFull));
                    }
                    return this._containerOut;
                }
            },
            // Managed - haulers keep it half filled
            'containerManaged': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._containerManaged) ){ 
                        let byType = c => c.source === true && c.controller == true;
                        this._containerManaged = _.filter(this.container, byType);
                    }
                    return this._containerManaged;
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
            if( !ROUTE_PLANNER_ENABLE ) return;
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
        Room.prototype.saveContainers = function(){
            if( _.isUndefined(this.memory.container) ){ 
                this.memory.container = [];
            } 
            let containers = this.find(FIND_STRUCTURES, {
                filter: (structure) => ( structure.structureType == STRUCTURE_CONTAINER )
            });
            // for each memory entry, keep if existing
            let kept = [];
            let keep = (entry) => {
                if( containers.find( (c) => c.id == entry.id ))
                    kept.push(entry);                     
            };
            this.memory.container.forEach(keep);
            this.memory.container = kept;

            // for each container add to memory ( if not contained )
            let add = (cont) => {
                if( !this.memory.container.find( (i) => i.id == cont.id ) ) {
                    let source = cont.pos.findInRange(this.sources, 1);
                    this.memory.container.push({
                        id: cont.id, 
                        source: (!!source), 
                        controller: (!!cont.pos.findInRange(this.controller, 3))
                    });
                    if( source ){
                        Memory.sources[source.id].container = cont.id;
                    }
                }
            };
            containers.forEach(add);
        };

        Room.prototype.loop = function(){
            // temporary cleanup
            if( this.memory.sourceIds ) delete this.memory.sourceIds;

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
            delete this._container;

            if( Game.time % MEMORY_RESYNC_INTERVAL == 0 ) {
                this.saveTowers();
                this.saveSpawns();
                this.saveContainers();
            }

            var that = this;               
            try {
                if( this.memory.hostileIds === undefined )
                    this.memory.hostileIds = [];
                if( this.memory.statistics === undefined)
                    this.memory.statistics = {};

                if( ROUTE_PLANNER_ENABLE && 
                    Game.time % ROUTE_PLANNER_INTERVAL == 0 && 
                    !this.constructionSites.find(c=> c.structureType == STRUCTURE_ROAD))
                        this.roadTick();

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
