var creeps = {
    balancing: {
      harvester: 10, 
      upgrader: 30, 
      builder: 60
    },
    role: {
        harvester: require('creep.role.harvester'),
        upgrader: require('creep.role.upgrader'),
        builder: require('creep.role.builder')
    },
    builds: {
        templateCosts: {
            WORK: 100, 
            CARRY: 50, 
            MOVE: 50
        },        
        worker: function(energy){
            var buildTemplate = {
                WORK: 1, 
                CARRY: 1, 
                MOVE: 1
            }
            var simpleCost = (buildTemplate.WORK * this.templateCosts.WORK) + 
                (buildTemplate.CARRY * this.templateCosts.CARRY) + 
                (buildTemplate.MOVE * this.templateCosts.MOVE);
            var multi = Math.floor(energy/simpleCost);
            buildTemplate.WORK *= multi;
            buildTemplate.CARRY *= multi;
            buildTemplate.MOVE *= multi;
            
            var build = [];
            
            for( ; buildTemplate.WORK > 0; buildTemplate.WORK-- ){
                build.push(WORK);
            }
            for( ; buildTemplate.CARRY > 0; buildTemplate.CARRY-- ){
                build.push(CARRY);
            }
            for( ; buildTemplate.MOVE > 0; buildTemplate.MOVE-- ){
                build.push(MOVE);
            }
            return build;
        }, 
        get: function(role, energy){
            //if( role == 'harvester' || role == 'upgrader' || role == 'builder')
            return this.worker(energy);
        }
    },
    count: {
        harvester: 0, 
        upgrader: 0, 
        builder: 0,
        total: 0,
        sum: function(){
            this.total = this.harvester + this.upgrader + this.builder;
        },
        upgraderQuote: function(){
            return (this.total == 0) ? 0 : 100 * this.upgrader / this.total;
        },
        harvesterQuote: function(){
            return (this.total == 0) ? 0 : 100 * this.harvester / this.total;
        },
        builderQuote: function(){
            return (this.total == 0) ? 0 : 100 * this.builder / this.total;
        }
    },
    reset: function(){
      this.count.harvester = 0;
      this.count.upgrader = 0;
      this.count.builder = 0;  
    },
    initCreeps: function(){
        for(var name in Memory.creeps) {
            var creep = Game.creeps[name];
            if(!creep) {                
                var id = Memory.creeps[name].id;
                var source = Memory.creeps[name].source;
                if( source != null ){
                    var sourceObj = Game.getObjectById(source);
                    if(sourceObj.room.memory.sources[source]) {
                        var index = sourceObj.room.memory.sources[source].creeps.indexOf(id);
                        if( index > -1 ) sourceObj.room.memory.sources[source].creeps.splice(index);
                    }
                }
                delete Memory.creeps[name];
                console.log('Clearing non-existing creep memory:', name);
            }
            else {
              if (!Memory.creeps[newName])
                Memory.creeps[newName].id = creep.id;

                if(creep.memory.role == 'harvester') {
                    creeps.role.harvester.run(creep);
                    creeps.count.harvester++;
                }
                if(creep.memory.role == 'upgrader') {
                    creeps.role.upgrader.run(creep);
                    creeps.count.upgrader++;
                }
                if(creep.memory.role == 'builder') {
                    creeps.role.builder.run(creep);
                    creeps.count.builder++;
                }
            }
        }
    },
    breed: function(spawn){
        if( spawn.room.memory.maxSourceCreeps > spawn.room.find(FIND_CREEPS).length){
            creeps.count.sum();
            var role = 'builder';
            if(creeps.count.harvesterQuote() < creeps.balancing.harvester) role = 'harvester';
            else if(creeps.count.upgraderQuote() < creeps.balancing.upgrader) role = 'upgrader';
            creeps.createCreep(spawn, role, spawn.energy);
        }
    },
	createCreep: function(spawn, role, energy){
        var build = this.builds.get(role, energy);
        if( build.length > 0 ){
            var newName = spawn.createCreep(build, undefined, {role: role, build: build, source: null});
            //Memory.creeps[newName].id = Game.creeps[newName].id;
            creeps.count[role] += size.weight;
            console.log('Spawning new ' + size.name + ' ' + role + ': ' + newName);
        }
	}
}

module.exports = creeps;