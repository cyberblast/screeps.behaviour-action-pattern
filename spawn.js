
var mod = {
    loop: function(){
        for(var iSpawn in Game.spawns){
            creeps.breed(Game.spawns[iSpawn]);
        }
    },
  balancing: {
    harvester: 40,
    upgrader: 20,
    builder: 40
  },
  builds: {
    templateCosts: {
      work: 100,
      carry: 50,
      move: 50
    },
    worker: function (energy) {
      var build = {
        cost: 0,
        parts: []
      }
      var simpleCost = 
          this.templateCosts.work +
          this.templateCosts.carry +
          this.templateCosts.move;
      var multi = Math.floor(energy / simpleCost);
      build.cost = simpleCost * multi;

      for (var iWork = 0; iWork < multi; iWork++) {
        build.parts.push(WORK);
      }
      for (var iCarry = 0; iCarry < multi; iCarry++) {
        build.parts.push(CARRY);
      }
      for (var iMove = 0; iMove < multi; iMove++) {
        build.parts.push(MOVE);
      }
      return build;
    },
    get: function (role, energy) {
      //if( role == 'harvester' || role == 'upgrader' || role == 'builder')
      return this.worker(energy);
    }
  },
  breed: function (spawn) {
    if (spawn.room.energyAvailable > 200 && 
        spawn.room.memory.maxSourceCreeps > spawn.room.find(FIND_CREEPS).length) {

      var roomCreeps = spawn.room.memory.creeps;
      var total = roomCreeps.harvester + roomCreeps.builder + roomCreeps.upgrader; 
      var harvesterQuote = spawn.room.memory.creeps.harvester / total; 
      var upgraderQuote = spawn.room.memory.creeps.upgrader / total;

      var role = 'builder';
      if (harvesterQuote < this.balancing.harvester) role = 'harvester';
      else if (upgraderQuote < this.balancing.upgrader) role = 'upgrader';

      this.createCreep(spawn, role, spawn.room.energyAvailable);
    } else console.log('Max Room creep count reached!');
  },
  createCreep: function (spawn, role, energy) {
    var build = this.builds.get(role, energy);
    if (build.parts.length > 0) {
      var name = null;
      for( var son = 1; name == null || Game.creeps[name]; son++ ) {
        name = role + '.' + build.cost + '.' + son;
      }
      console.log(name);
      var newName = spawn.createCreep(build.parts, name, { role: role, build: build, source: null });
      spawn.room.memory.creeps[role] += build.cost;
      console.log('Spawning new ' + role + ' for ' + build.cost + ': ' + newName);
    }
  }
};

module.exports = mod;