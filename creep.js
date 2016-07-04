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
  count: {
    harvester: 0,
    upgrader: 0,
    builder: 0,
    total: 0,
    sum: function () {
      this.total = this.harvester + this.upgrader + this.builder;
    },
    upgraderQuote: function () {
      return (this.total == 0) ? 0 : 100 * this.upgrader / this.total;
    },
    harvesterQuote: function () {
      return (this.total == 0) ? 0 : 100 * this.harvester / this.total;
    },
    builderQuote: function () {
      return (this.total == 0) ? 0 : 100 * this.builder / this.total;
    }
  },
  initCreeps: function (resetMemory) {
    this.count.harvester = 0;
    this.count.upgrader = 0;
    this.count.builder = 0;
    for (var name in Memory.creeps) {
      var creep = Game.creeps[name];
      if (!creep) {
        var id = Memory.creeps[name].id;
        var source = Memory.creeps[name].source;
        if (source != null) {
          var sourceObj = Game.getObjectById(source);
          if (sourceObj && sourceObj.room.memory.sources[source]) {
            var index = sourceObj.room.memory.sources[source].creeps.indexOf(id);
            if (index > -1) sourceObj.room.memory.sources[source].creeps.splice(index);
          }
        }
        delete Memory.creeps[name];
        console.log('Clearing non-existing creep memory:', name);
      } else {
        if (!creep.memory.id)
          creep.memory.id = creep.id;
        if(resetMemory){
          creep.memory.source = null;
        }

        if (creep.memory.role == 'harvester') {
          if( !creeps.role.harvester.run(creep) )
            creeps.role.builder.run(creep);
          creeps.count.harvester += creep.memory.build.cost;
        }
        if (creep.memory.role == 'upgrader') {
          if( !creeps.role.upgrader.run(creep) )
            creeps.role.harvester.run(creep);
          creeps.count.upgrader += creep.memory.build.cost;
        }
        if (creep.memory.role == 'builder') {
          if( !creeps.role.builder.run(creep) )
            creeps.role.harvester.run(creep);
          creeps.count.builder += creep.memory.build.cost;
        }
      }
    }
  },
  breed: function (spawn) {
    if (spawn.room.memory.maxSourceCreeps > spawn.room.find(FIND_CREEPS).length) {
      creeps.count.sum();
      var role = 'builder';
      if (creeps.count.harvesterQuote() < creeps.balancing.harvester) role = 'harvester';
      else if (creeps.count.upgraderQuote() < creeps.balancing.upgrader) role = 'upgrader';
      creeps.createCreep(spawn, role, spawn.room.energyAvailable);
    } else console.log('Max Room creep count reached!');
  },
  createCreep: function (spawn, role, energy) {
    var build = this.builds.get(role, energy);
    if (build.parts.length > 0) {
      var newName = spawn.createCreep(build.parts, undefined, { role: role, build: build, source: null });
      //Memory.creeps[newName].id = Game.creeps[newName].id;
      creeps.count[role] += build.cost; //creeps.count[role] += size.weight;
      console.log('Spawning new ' + role + ': ' + newName);
    }
  }
}

module.exports = creeps;