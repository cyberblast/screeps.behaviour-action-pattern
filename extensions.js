var mod = {
    init: function(){
        //if(DEBUG) console.log('Tick: ' + Game.time ); 
        var log = '';
        
        Source.prototype.init = function() {
            var fields = this.room.lookForAtArea(LOOK_TERRAIN, this.pos.y-1, this.pos.x-1, this.pos.y+1, this.pos.x+1, true);
            this.accessibleFields = 9-_.countBy( fields , "terrain" ).wall;
        };
        
        Room.prototype.init = function(){
            // Room
            log += 'Extending Room "' + this.name + '":';
            var self = this;
            //this.id = this.name;
            
            // Construction Sites
            this.constructionSites = {
                order: [], // ids, ordered descending by remaining progress
                count: 0
            };
            _.sortBy(this.find(FIND_CONSTRUCTION_SITES), 
                function(o) { 
                    return o.progress * -1; 
                }).forEach(function(site){
                    site.creeps = [];
                    self.constructionSites.order.push(site.id);
                    self.constructionSites.count++;
                    self.constructionSites[site.id] = site; 
                });
            log += '\n - ' + this.constructionSites.count + ' construction sites';
            
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
            log += '\n - ' + this.sourceAccessibleFields + ' source access fields';
            
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
            _.sortBy(this.find(FIND_STRUCTURES, {
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
                    
            log += '\n - ' + this.repairableSites.count + ' damaged sites (' + this.creepRepairableSites.count + ' important)';
            
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
                if( creep.memory.action ){
                    var action = creep.memory.action;
                } else action = 'idle';
                if(!this.activities[action])
                    this.activities[action] = 1;
                else this.activities[action]++;
                if( creep.memory.target ){
                    creep.target = Game.getObjectById(creep.memory.target);
                    if( creep.target != null ){
                        if( !creep.target.creeps ) creep.target.creeps = [];
                            creep.target.creeps.push(creep.name);
                    }
                }
            });
            this.maxPerJob = _.max([1,self.creeps.length/3.1]);
            log += '\n - ' + this.creeps.length + ' creeps \n     ' + JSON.stringify(this.activities) + '\n     ' + JSON.stringify(this.population);
            
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
            log += '\n - ' + this.towers.length + ' towers with ' + this.towerFreeCapacity + ' free capacity';
            
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
                invasion: self.hostiles.length > 0
            }
            
            // Memory
            this.setMemory = function(obj){
                if( !Memory.rooms ) Memory.rooms = {};
                Memory.rooms[this.name] = obj;
            }
            this.memory = (Memory.rooms && Memory.rooms[this.name] ? Memory.rooms[this.name] : { 
                hostileIds : [], 
                history: []
            });
            this.hostileIds.forEach( function(id){
                if( !self.memory.hostileIds.includes(id) ){
                    var creep = Game.getObjectById(id);
                    var message = 'Hostile intruder ' + id + ' (' + creep.body.length + ' body parts) from "' + (creep.owner && creep.owner.username ? creep.owner.username : 'unknown') + '" in room ' + self.name + ' at ' + Game.time + ' ticks.'
                    Game.notify(message);//<br/>Body: ' + JSON.stringify(creep.body));
                    console.log(message);
                }
            });
            this.memory.hostileIds = this.hostileIds;
            
            if( this.storage && Game.time % 1000 == 0 ) {
                if( !this.memory.history ) this.memory.history = [];
                this.memory.history.push({
                    tick: Game.time, 
                    time: (new Date(Date.now() + 7200000)).toLocaleString(),
                    store: JSON.stringify(this.storage.store)
                });
                if( this.memory.history.length > 10 )
                    this.memory.history.splice(0, this.memory.history.length-100);
                this.createReport(true);
            }
            
            this.setMemory(this.memory);
        };
        
        Room.prototype.createReport = function(mail){
                var firstRecord = JSON.parse( this.memory.history[0].store );
                var lastRecord = this.storage.store;
                var message = '<b>Storage report</b><br/>' + (new Date(Date.now() + 7200000)).toLocaleString() + ' (' + this.memory.history[0].time + ')<br/>';
                for( var type in firstRecord ){ // changed & depleted
                    var dif = (lastRecord[type] ? lastRecord[type] - firstRecord[type] : firstRecord[type] * -1);
                    message += type + ': ' + (lastRecord[type]?lastRecord[type]:0) + ' (' + (dif > -1 ? '+' : '' ) + dif + ')<br/>';  
                }
                // new
                for( var type in lastRecord ){
                    if(!firstRecord[type])
                        message += type + ': ' + lastRecord[type] + ' (' + lastRecord[type] + ')<br/>';  
                }
                if( mail ) Game.notify(message);
                console.log(message);
        }
        
        _.forEach(Game.rooms, function(room, name){
            room.init();
        });
        //if(DEBUG) console.log(log); 
    }
}

module.exports = mod;