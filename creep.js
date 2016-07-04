var creeps = {
  role: {
    harvester: require('creep.role.harvester'),
    upgrader: require('creep.role.upgrader'),
    builder: require('creep.role.builder')
  },
  loop: function () {
    for (var name in Memory.creeps) {
      var creep = Game.creeps[name];
      if (!creep) {
        console.log('Clearing non-existing creep memory:', name);
        delete Memory.creeps[name];
      } else {
        if (!creep.memory.id)
        creep.memory.id = creep.id; // bug @ createCreep Workaround

        if (creep.memory.role == 'harvester') {
          creep.room.memory.creeps.harvester += creep.memory.build.cost;
        }
        if (creep.memory.role == 'upgrader') {
          creep.room.memory.creeps.upgrader += creep.memory.build.cost;
        }
        if (creep.memory.role == 'builder') {
          creep.room.memory.creeps.builder += creep.memory.build.cost;
        }
        if( creep.memory.source != null && creep.room.memory.sources[creep.memory.source])
          creep.room.memory.sources[creep.memory.source].creeps.push(creep.id);
      }
    };
    for (var name in Memory.creeps) {
      var creep = Game.creeps[name];
        if (creep.memory.role == 'harvester') {
          if( !this.role.harvester.run(creep) )
            this.role.builder.run(creep);
        }
        if (creep.memory.role == 'upgrader') {
          if( !this.role.upgrader.run(creep) )
            this.role.harvester.run(creep);
        }
        if (creep.memory.role == 'builder') {
          if( !this.role.builder.run(creep) )
            this.role.harvester.run(creep);
        }
      }
  }
}

module.exports = creeps;