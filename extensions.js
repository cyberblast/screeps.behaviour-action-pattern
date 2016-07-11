var mod = {
    init: function(){
        if(DEBUG) console.log('Tick: ' + Game.time ); 
        var log = '';
        
        RoomObject.prototype.creeps = [];
        
        Source.prototype.init = function() {
            this.creeps = [];
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
                if( struct.hits < 1000 || struct.structureType in coreStructures ){
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
            });
            this.maxPerJob = _.max([2,self.creeps.length/3.5]);
            log += '\n - ' + this.creeps.length + ' creeps \n     ' + JSON.stringify(this.activities) + '\n     ' + JSON.stringify(this.population);
            
            this.towers = [];
            this.towerFreeCapacity = 0;
            _.sortBy(this.find(FIND_MY_STRUCTURES, {
                filter: {structureType: STRUCTURE_TOWER}
            }), function(o) { 
                return o.energy; 
            }).forEach(function(struct){
                struct.creeps = [];
                self.towers.push(struct);
                self.towerFreeCapacity += struct.energyCapacity + struct.energy;
            });
            
            
            log += '\n - ' + this.towers.length + ' towers with ' + this.towerFreeCapacity + ' free capacity';
            
            if(this.storage && this.storage.store){
                this.storage.sum = _.sum(this.storage.store);
            }
        };
        
        _.forEach(Game.rooms, function(room, name){
            room.init();
        });
        if(DEBUG) console.log(log); 
    }
}

module.exports = mod;