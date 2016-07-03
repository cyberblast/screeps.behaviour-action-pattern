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
    bodyParts: {
        harvester: {
            xs: [WORK,CARRY,MOVE]
            s: [WORK,WORK,CARRY,CARRY,MOVE,MOVE]
            m: [WORK,WORK,WORK,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE]
            l: [WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE]
            xl: [WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE]
            xxl: [WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE]
        }, 
        upgrader: {
            xs: [WORK,CARRY,MOVE]
            s: [WORK,WORK,CARRY,CARRY,MOVE,MOVE]
            m: [WORK,WORK,WORK,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE]
            l: [WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE]
            xl: [WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE]
            xxl: [WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE]
        }, 
        builder: {
            xs: [WORK,CARRY,MOVE]
            s: [WORK,WORK,CARRY,CARRY,MOVE,MOVE]
            m: [WORK,WORK,WORK,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE]
            l: [WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE]
            xl: [WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE]
            xxl: [WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE]
        }
    },
    sizes: {
        getMaxForEnergy: function(energy){
            if(energy < 200) return null;
            if(energy < 400) return this.xs;
            if(energy < 600) return this.s;
            if(energy < 800) return this.m;
            if(energy < 1000) return this.l;
            if(energy < 1500) return this.xl;
            return this.xxl;
        },
        xs: {
            cost: 200, 
            weight: 1, 
            name: 'xs'
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
                delete Memory.creeps[name];
                console.log('Clearing non-existing creep memory:', name);
            }
            else {
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
            var size = creeps.sizes.getMaxForEnergy(spawn.energy);
            if(size) {
                creeps.count.sum();
                var role = 'builder';
                if(creeps.count.harvesterQuote() < creeps.balancing.harvester) role = 'harvester';
                else if(creeps.count.upgraderQuote() < creeps.balancing.upgrader) role = 'upgrader';
                creeps.createCreep(spawn, role, size);
            }
        }
    },
	createCreep: function(spawn, role, size){
        var newName = spawn.createCreep(this.bodyParts[role][size.name], undefined, {role: role, size: size.name, source: null});
	    creeps.count[role] += size.weight;
        console.log('Spawning new ' + size.name + ' ' + role + ': ' + newName);
	}
}

module.exports = creeps;