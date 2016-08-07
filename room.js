var mod = {
    extend: function(){
        Object.defineProperty(Room.prototype, 'sources', {
            configurable: true,
            get: function() {
                if( _.isUndefined(this.memory.sourceIds) ) { // inital memorization
                    this.memory.sourceIds = [];
                    let sources = this.find(FIND_SOURCES);
                    if( sources.length > 0 ){
                        var byAccess = source => source.accessibleFields;
                        var sourceId = source => source.id;
                        this.memory.sourceIds = _.map(_.sortBy(sources, byAccess), sourceId);
                    } else this.memory.sourceIds = [];
                }
                if( _.isUndefined(this._sources) ){ // each loop: get real objects 
                    this._sources = [];
                    var addSource = id => { AddById(this._sources, id); };
                    _.forEach(this.memory.sourceIds, addSource);
                }
                return this._sources;
            }
        });
        Object.defineProperty(Room.prototype, 'sourceAccessibleFields', {
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
        });
        Object.defineProperty(Room.prototype, 'sourceEnergyAvailable', {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._sourceEnergyAvailable) ){ 
                    this._sourceEnergyAvailable = 0;
                    var countEnergy = source => (this._sourceEnergyAvailable += source.energy);
                    _.forEach(this.sources, countEnergy);
                }
                return this._sourceEnergyAvailable;
            }
        });
        Object.defineProperty(Room.prototype, 'relativeEnergyAvailable', {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._relativeEnergyAvailable) ){  
                    this._relativeEnergyAvailable = this.energyCapacityAvailable > 0 ? this.energyAvailable / this.energyCapacityAvailable : 0;
                }
                return this._relativeEnergyAvailable;
            }
        });
        Object.defineProperty(Room.prototype, 'spawns', {
            configurable: true,
            get: function() {
                if( _.isUndefined(this.memory.spawns) ) { // inital memorization
                    this.memory.spawns = [];
                    let spawns = this.find(FIND_MY_SPAWNS);
                    if( spawns.length > 0 ){
                        var spawnId = spawn => spawn.id;
                        this.memory.spawns = _.map(spawns, spawnId);
                    } else this.memory.spawns = [];
                }
                if( _.isUndefined(this._spawns) ){ // each loop: get real objects 
                    this._spawns = [];
                    var addSpawn = id => { AddById(this._spawns, id); };
                    _.forEach(this.memory.spawns, addSpawn);
                }
                return this._spawns;
            }
        });
        Object.defineProperty(Room.prototype, 'towers', {
            configurable: true,
            get: function() {
                if( _.isUndefined(this.memory.towers) || Game.time % MEMORY_RESYNC_INTERVAL == 0) { // inital memorization
                    this.memory.towers = [];
                    let towers = this.find(FIND_MY_STRUCTURES, {
                        filter: {structureType: STRUCTURE_TOWER}
                    });
                    if( towers.length > 0 ){
                        var id = obj => obj.id;
                        this.memory.towers = _.map(towers, id);
                    } else this.memory.towers = [];
                }
                if( _.isUndefined(this._towers) ){ // each loop: get real objects 
                    this._towers = [];
                    var add = id => { AddById(this._towers, id); };
                    _.forEach(this.memory.towers, add);
                }
                return this._towers;
            }
        });
        Object.defineProperty(Room.prototype, 'towerFreeCapacity', {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._towerFreeCapacity) ) { 
                    this._towerFreeCapacity = 0;
                    var addFreeCapacity = tower => this._towerFreeCapacity += (tower.energyCapacity - tower.energy);
                    _.forEach(this.towers, addFreeCapacity);
                }
                return this._towerFreeCapacity;
            }
        });
        Object.defineProperty(Room.prototype, 'constructionSites', {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._constructionSites) ){ 
                    this._constructionSites = this.find(FIND_MY_CONSTRUCTION_SITES); 
                }
                return this._constructionSites;
            }
        });
        
        Room.loop = function(){
            var loop = room => room.loop();
            _.forEach(Game.rooms, loop);
        };
        Room.prototype.loop = function(){
            // temporary cleanup: 
            if( this.memory.report !== undefined ){
                this.memory.statistics = this.memory.report;
                Memory.statistics = {
                    tick: this.memory.report.tick, 
                    time: this.memory.report.time
                }
                delete this.memory.report;
            }

            // Room
            var self = this;
            if( this.population === undefined ) this.population = {};

            this.repairableSites = {
                order: [], 
                count: 0
            }
            this.creepRepairableSites = {
                order: [], 
                count: 0
            }

            // RepairableSites
            var coreStructures = [STRUCTURE_SPAWN,STRUCTURE_EXTENSION,STRUCTURE_ROAD,STRUCTURE_CONTROLLER];  
            _.sortBy(this.find(FIND_STRUCTURES, {
                filter: (structure) => structure.hits < structure.hitsMax && structure.hits < TOWER_REPAIR_LIMITS[this.controller.level] && (structure.structureType != STRUCTURE_ROAD || structure.hitsMax - structure.hits > 800 ) }) , 
                'hits'
            ).forEach(function(struct){
                struct.creeps = [];
                struct.towers = [];
                self.repairableSites.order.push(struct.id);
                self.repairableSites.count++;
                self.repairableSites[struct.id] = struct;
                if( struct.hits < LIMIT_CREEP_REPAIRING || struct.structureType in coreStructures ){
                    self.creepRepairableSites.order.push(struct.id);
                    self.creepRepairableSites.count++;
                    self.creepRepairableSites[struct.id] = struct;
                }
            });
            
            this.maxPerJob = _.max([1,(self.population && self.population.worker ? self.population.worker.count : 0)/3.1]);
                        
            // Hostiles
            this.hostiles = this.find(FIND_HOSTILE_CREEPS);
            this.hostileIds = _.map(this.hostiles, 'id');
            var healer = creep => _.some( creep.body, {'type': HEAL} );
            this.hostilesHeal = _.filter(this.hostiles, healer);
            
            // storage
            if(this.storage && this.storage.store){
                this.storage.sum = _.sum(this.storage.store);
            }

            // Situation
            this.situation = {
                noEnergy: this.sourceEnergyAvailable == 0, 
                invasion: false
            }
            try{
                if( this.memory.hostileIds ){                    
                    if(self.memory.statistics === undefined)
                        self.memory.statistics = {};
                    this.situation.invasion = this.hostiles.length > 0;
                    if( this.controller && this.controller.my ) {
                        this.hostileIds.forEach( function(id){
                            if( !self.memory.hostileIds.includes(id) ){
                                var creep = Game.getObjectById(id);
                                //var body = "";
                                //var concat = (value, key) => body += ', ' + key + ':' + value;
                                //var count = _.countBy(creep.body, 'type');
                                //_.forEach(count, concat);
                                var bodyCount = JSON.stringify( _.countBy(creep.body, 'type') );
                                if( creep.owner.username != 'Invader' ){
                                    var message = 'Hostile intruder ' + id + ' (' + bodyCount + ') from "' + creep.owner.username + '" in room ' + self.name + ' at ' + LocalDate(new Date()).toLocaleString();
                                    Game.notify(message);
                                    console.log(message);
                                }
                                if(self.memory.statistics.invaders === undefined)
                                    self.memory.statistics.invaders = [];
                                self.memory.statistics.invaders.push({
                                    owner: creep.owner.username, 
                                    id: id,
                                    body: bodyCount, 
                                    enter: Game.time, 
                                    time: Date.now()
                                });
                            }
                        });
                        this.memory.hostileIds.forEach( function(id){
                            if( !self.hostileIds.includes(id) && self.memory.statistics && self.memory.statistics.invaders !== undefined && self.memory.statistics.invaders.length > 0){
                                var select = invader => invader.id == id && invader.leave === undefined;
                                var entry = _.find(self.memory.statistics.invaders, select);
                                if( entry != undefined ) entry.leave = Game.time;
                            }
                        });
                    }
                }
            }
            catch(err) {
                Game.notify(err);
                console.log('Error in room.js: ' + err);
            }
            this.memory.hostileIds = this.hostileIds;            
        };
    }
}

module.exports = mod;