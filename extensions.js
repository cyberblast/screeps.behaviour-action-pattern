var mod = {
    init: function(){

        Object.defineProperty(Structure.prototype, 'memory', {
            configurable: true,
            get: function() {
                if(_.isUndefined(Memory.structures)) {
                    Memory.structures = {};
                }
                if(!_.isObject(Memory.structures)) {
                    return undefined;
                }
                return Memory.structures[this.id] = Memory.structures[this.id] || {};
            },
            set: function(value) {
                if(_.isUndefined(Memory.structures)) {
                    Memory.structures = {};
                }
                if(!_.isObject(Memory.structures)) {
                    throw new Error('Could not set memory extension for structures');
                }
                Memory.structures[this.id] = value;
            }
        });
        
        Game.population = {};
        
        Source.prototype.init = function() {
            var fields = this.room.lookForAtArea(LOOK_TERRAIN, this.pos.y-1, this.pos.x-1, this.pos.y+1, this.pos.x+1, true);
            this.accessibleFields = 9-_.countBy( fields , "terrain" ).wall;
        };
        
        Room.prototype.init = function(){
            // Room
            var self = this;
            //this.id = this.name;
            
            // Construction Sites
            this.constructionSites = {
                order: [], // ids, ordered descending by remaining progress
                count: 0
            };
            _.sortBy(this.find(FIND_MY_CONSTRUCTION_SITES), 
                function(o) { 
                    return o.progress * -1; 
                }).forEach(function(site){
                    site.creeps = [];
                    self.constructionSites.order.push(site.id);
                    self.constructionSites.count++;
                    self.constructionSites[site.id] = site; 
                });
            
            // Sources
            this.sourceAccessibleFields = 0;
            this.sourceEnergyAvailable = 0;
            this.sources = [];
            _.sortBy(this.find(FIND_SOURCES), 
                function(o) { 
                    o.init();
                    return o.accessibleFields;
                }).forEach((source) => {
                    this.sources.push(source);
                    self.sourceAccessibleFields += source.accessibleFields;
                    self.sourceEnergyAvailable += source.energy;
                });
            
            // RepairableSites
            var coreStructures = [STRUCTURE_SPAWN,STRUCTURE_EXTENSION,STRUCTURE_ROAD,STRUCTURE_CONTROLLER];  
            this.repairableSites = {
                order: [], 
                count: 0
            }
            this.creepRepairableSites = {
                order: [], 
                count: 0
            }
            _.sortBy(this.find(FIND_MY_STRUCTURES, {
                filter: (structure) => structure.hits < structure.hitsMax
            }), function(o) { 
                return o.hits; 
            }).forEach(function(struct){
                struct.creeps = [];
                self.repairableSites.order.push(struct.id);
                self.repairableSites.count++;
                self.repairableSites[struct.id] = struct;
                if( struct.hits < LIMIT_CREEP_REPAIRING || struct.structureType in coreStructures ){
                    self.creepRepairableSites.order.push(struct.id);
                    self.creepRepairableSites.count++;
                    self.creepRepairableSites[struct.id] = struct;
                }
            });
            
            // Creeps
            this.activities = {}; // of creeps
            this.population = {};
            this.creeps = this.find(FIND_MY_CREEPS);
            this.creeps.forEach((creep) => {
                var setup = 'unknown';
                if( creep.memory.setup )
                    setup = creep.memory.setup;
                if(!this.population[setup]){
                    this.population[setup] = {
                        weight: creep.memory.cost, 
                        count : 1
                    };
                }
                else {
                    this.population[setup].count++;
                    this.population[setup].weight += creep.memory.cost;
                }
                if(!Game.population[setup]){
                    Game.population[setup] = {
                        weight: creep.memory.cost, 
                        count : 1
                    };
                }
                else {
                    Game.population[setup].count++;
                    Game.population[setup].weight += creep.memory.cost;
                }
                if( creep.memory.action ){
                    var action = creep.memory.action;
                } else action = 'idle';
                if(!this.activities[action])
                    this.activities[action] = 1;
                else this.activities[action]++;
                if( creep.memory.target ){
                    creep.target = Game.getObjectById(creep.memory.target) || Game.spawns[creep.memory.target];
                    if( creep.target != null ){
                        creep.registerTarget(creep.target);
                    }
                }
            });
            this.maxPerJob = _.max([1,(self.population.worker || 0)/3.1]);
            
            this.towers = [];
            this.towerFreeCapacity = 0;
            _.sortBy(this.find(FIND_MY_STRUCTURES, {
                filter: {structureType: STRUCTURE_TOWER}
            }), function(o) { 
                return o.energy; 
            }).forEach(function(struct){
                self.towers.push(struct);
                self.towerFreeCapacity += (struct.energyCapacity - struct.energy);
            });
            
            this.hostiles = this.find(FIND_HOSTILE_CREEPS);
            this.hostileIds = _.map(this.hostiles, 'id');
            this.hostilesHeal = this.find(FIND_HOSTILE_CREEPS, {
                filter: function(hostile) { 
                    return _.some( hostile.body, {'type': HEAL} );
                }
            });
            
            if(this.storage && this.storage.store){
                this.storage.sum = _.sum(this.storage.store);
            }

            // Situation
            this.situation = {
                noEnergy: self.sourceEnergyAvailable == 0, 
                invasion: false
            }
            
            if( this.controller.my && this.memory.hostileIds ){
                this.situation.invasion = this.hostiles.length > 0;
                this.hostileIds.forEach( function(id){
                    if( !self.memory.hostileIds.includes(id) ){
                        var creep = Game.getObjectById(id);
                        var message = 'Hostile intruder ' + id + ' (' + creep.body.length + ' body parts) from "' + (creep.owner && creep.owner.username ? creep.owner.username : 'unknown') + '" in room ' + self.name + ' at ' + Game.time + ' ticks.'
                        Game.notify(message);
                        console.log(message);
                    }
                });
                this.memory.hostileIds.forEach( function(id){
                    if( !self.hostileIds.includes(id) ){
                        var message = 'Hostile intruder ' + id  + ' is gone'; 
                        Game.notify(message);
                        console.log(message);
                    }
                });
            }
            this.memory.hostileIds = this.hostileIds;
            
            if( this.storage && Game.time % 1000 == 0 ) {
                this.sendReport(true);
                this.memory.storageReport = {
                    tick: Game.time, 
                    time: new Date(Date.now() + 7200000).getTime(),
                    store: this.storage.store
                };
            }
        };
        
        Room.prototype.sendReport = function(mail){
                if( !this.memory.storageReport ) return;
                var memoryRecord = this.memory.storageReport.store;
                var currentRecord = this.storage.store;
                var now = new Date(Date.now() + 7200000);
                var message = '<b>Storage report</b> for room ' + this.name + '<br/>' + now.toLocaleString() + ' (' + parseInt((now.getTime() - this.memory.storageReport.time)/60000) + ' minutes dif)<br/>';
                for( var type in memoryRecord ){ // changed & depleted
                    var dif = (currentRecord[type] ? currentRecord[type] - memoryRecord[type] : memoryRecord[type] * -1);
                    message += type + ': ' + (currentRecord[type] || 0) + ' (' + (dif > -1 ? '+' : '' ) + dif + ')<br/>';  
                }
                // new
                for( var type in currentRecord ){
                    if(!memoryRecord[type])
                        message += type + ': ' + currentRecord[type] + ' (' + currentRecord[type] + ')<br/>';  
                }
                if( mail ) Game.notify(message);
                console.log(message);
        }
        
        Object.defineProperty(Creep.prototype, 'behaviour', {
            configurable: true,
            get: function() {
                if(this.memory.setup) {
                    return MODULES.creep.behaviour[this.memory.setup];
                }
                return null;
            }
        });
        
        Creep.prototype.run = function(){
            if( !this.spawning ){
                var behaviour = this.behaviour;
                if( behaviour ) behaviour.run(this);
            }
        }

        Creep.prototype.registerTarget = function(target){  
            if( target == null ) return;
            if( !this.memory.setup ) return;   
            if( !target.creeps ) {
                target.creeps = {};
            }
            if( !target.creeps[this.memory.setup] ){
                target.creeps[this.memory.setup] = [];
            }
            if( !target.creeps[this.memory.setup].includes(creep.name) ) 
                target.creeps[this.memory.setup].push(creep.name);
        }
        Creep.prototype.unregisterTarget = function(target){   
            if( target == null ) return;
            if( !this.memory.setup ) return;   
            if( !target.creeps ) return;
            if( !target.creeps[this.memory.setup] ) return;
            if( !target.creeps[this.memory.setup].includes(creep.name) ) return;

            target.creeps[this.memory.setup].splice(target.creeps[this.memory.setup].indexOf(creep.name), 1);
        }
        
        _.forEach(Game.rooms, function(room, name){
            //if( room.controller.my )
                room.init();
        });
    }
}

module.exports = mod;