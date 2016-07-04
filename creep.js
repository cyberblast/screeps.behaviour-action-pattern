var creeps = {
  balancing: {
    harvester: 40,
    upgrader: 20,
    builder: 40
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
    worker: function (energy) {
      var buildTemplate = {
        WORK: 1,
        CARRY: 1,
        MOVE: 1,
        cost: 0,
        parts: null
      }
      var simpleCost = (buildTemplate.WORK * this.templateCosts.WORK) +
          (buildTemplate.CARRY * this.templateCosts.CARRY) +
          (buildTemplate.MOVE * this.templateCosts.MOVE);
      var multi = Math.floor(energy / simpleCost);
      buildTemplate.WORK *= multi;
      buildTemplate.CARRY *= multi;
      buildTemplate.MOVE *= multi;
      buildTemplate.cost = simpleCost * multi;

      var build = [];

      for (; buildTemplate.WORK > 0; buildTemplate.WORK--) {
        build.push(WORK);
      }
      for (; buildTemplate.CARRY > 0; buildTemplate.CARRY--) {
        build.push(CARRY);
      }
      for (; buildTemplate.MOVE > 0; buildTemplate.MOVE--) {
        build.push(MOVE);
      }
      buildTemplate.parts = build;
      return buildTemplate;
    },
    get: function (role, energy) {
      //if( role == 'harvester' || role == 'upgrader' || role == 'builder')
      return this.worker(energy);
    }
  },
  inventory: function(){
    for (var name in Memory.creeps) {
      var creep = Game.creeps[name];
      if (!creep) {
        console.log('Clearing non-existing creep memory:', name);
        delete Memory.creeps[name];
      } else {
        if (!creep.memory.id)
        creep.memory.id = creep.id; // bug @ createCreep Workaround

        if (creep.memory.role == 'harvester') {
          room.memory.creeps.harvester += creep.memory.build.cost;
        }
        if (creep.memory.role == 'upgrader') {
          room.memory.creeps.upgrader += creep.memory.build.cost;
        }
        if (creep.memory.role == 'builder') {
          room.memory.creeps.builder += creep.memory.build.cost;
        }
      }
    }
  },
  init: function () {
    for (var name in Memory.creeps) {
      var creep = Game.creeps[name];
        if (creep.memory.role == 'harvester') {
          if( !creep.role.harvester.run(creep) )
            creep.role.builder.run(creep);
        }
        if (creep.memory.role == 'upgrader') {
          if( !creep.role.upgrader.run(creep) )
            creep.role.harvester.run(creep);
        }
        if (creep.memory.role == 'builder') {
          if( !creep.role.builder.run(creep) )
            creep.role.harvester.run(creep);
        }
      }
  },
  breed: function (spawn) {
    if (spawn.room.memory.maxSourceCreeps > spawn.room.find(FIND_CREEPS).length) {

      var roomCreeps = spawn.room.memory.creeps;
      var total = roomCreeps.harvester + roomCreeps.builder + roomCreeps.upgrader; 
      var harvesterQuote = spawn.room.memory.creeps.harvester / total; 
      var upgraderQuote = spawn.room.memory.creeps.upgrader / total;

      var role = 'builder';
      if (harvesterQuote < this.balancing.harvester) role = 'harvester';
      else if (upgraderQuote < this.balancing.upgrader) role = 'upgrader';

      creeps.createCreep(spawn, role, spawn.room.energyAvailable);
    } else console.log('Max Room creep count reached!');
  },
  createCreep: function (spawn, role, energy) {
    var build = this.builds.get(role, energy);
    if (build.parts.length > 0) {
      var newName = spawn.createCreep(build.parts, undefined, { role: role, build: build, source: null });
      spawn.room.memory.creeps[role] += build.cost;
      console.log('Spawning new ' + role + ' for ' + build.cost + ': ' + newName);
    }
  }
}

module.exports = creeps;