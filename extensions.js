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
            this.sources = this.find(FIND_SOURCES);
            this.sources.forEach((source) => {
                source.init();
                self.sourceAccessibleFields += source.accessibleFields;
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
                if(struct.hits < 1000 || (struct.hits < struct.hitsMax && struct.structureType in coreStructures) ){
                    self.creepRepairableSites.order.push(struct.id);
                    self.creepRepairableSites.count++;
                    self.creepRepairableSites[struct.id] = struct;
                }
            });
                    
            log += '\n - ' + this.repairableSites.count + ' damaged sites (' + this.creepRepairableSites.count + ' important)';
            
            this.activities = {}; // of creeps
            this.creeps = this.find(FIND_MY_CREEPS);
            this.creeps.forEach((creep) => {
                if( creep.memory.action ){
                    var action = creep.memory.action;
                    if(!this.activities[action])
                        this.activities[action] = 1;
                    else this.activities[action]++;
                }
            });
            log += '\n - ' + this.creeps.length + ' creeps ' + JSON.stringify(this.activities);
        };
        
        _.forEach(Game.rooms, function(room, name){
            room.init();
        });
        if(DEBUG) console.log(log); 
    }
}

module.exports = mod;