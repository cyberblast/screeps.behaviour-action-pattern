var mod = {
    extend: function(){
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
            this.sourceAccessibleFields = 0;
            this.sourceEnergyAvailable = 0;
            this.relativeEnergyAvailable = this.energyCapacityAvailable > 0 ? this.energyAvailable / this.energyCapacityAvailable : 0;
            this.sources = [];            
            this.constructionSites = {
                order: [], // ids, ordered descending by remaining progress
                count: 0
            };
            this.repairableSites = {
                order: [], 
                count: 0
            }
            this.creepRepairableSites = {
                order: [], 
                count: 0
            }
            this.towers = [];
            this.towerFreeCapacity = 0;

            // Construction Sites
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
            
            // Towers
            _.sortBy(this.find(FIND_MY_STRUCTURES, {
                filter: {structureType: STRUCTURE_TOWER}
            }), function(o) { 
                return o.energy; 
            }).forEach(function(struct){
                self.towers.push(struct);
                self.towerFreeCapacity += (struct.energyCapacity - struct.energy);
            });

            // Spawns
            this.spawns = this.find(FIND_MY_SPAWNS);
            
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
                noEnergy: self.sourceEnergyAvailable == 0, 
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
                                var body = "";
                                var concat = (value, key) => body += ', ' + key + ':' + value;
                                var count = _.countBy(creep.body, 'type');
                                _.forEach(count, concat);
                                if( creep.owner.username != 'Invader' ){
                                    var message = 'Hostile intruder ' + id + ' (' + body.substr(2) + ') from "' + creep.owner.username + '" in room ' + self.name + ' at ' + LocalDate(new Date()).toLocaleString();
                                    Game.notify(message);
                                    console.log(message);
                                }
                                if(self.memory.statistics.invaders === undefined)
                                    self.memory.statistics.invaders = [];
                                self.memory.statistics.invaders.push({
                                    owner: creep.owner.username, 
                                    id: id,
                                    body: body.substr(2), 
                                    enter: Game.time, 
                                    time: Date.now()
                                });
                            }
                        });
                        this.memory.hostileIds.forEach( function(id){
                            if( !self.hostileIds.includes(id) && self.memory.statistics && self.memory.statistics.invaders !== undefined && self.memory.statistics.invaders.length > 0){
                                /*
                                var message = 'Hostile intruder ' + id  + ' gone at ' + Game.time + ' ticks.'; 
                                Game.notify(message, INTRUDER_REPORT_DELAY);
                                console.log(message);
                                */
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
                console.log(err);
            }
            this.memory.hostileIds = this.hostileIds;            
        };        
    }
}

module.exports = mod;