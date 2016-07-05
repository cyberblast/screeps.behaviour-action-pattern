var creeps = {
  role: {
    harvester: require('creep.role.harvester'),
    upgrader: require('creep.role.upgrader'),
    builder: require('creep.role.builder'), 
    worker: require('creep.behaviour.worker')
  },
  loop: function (strategy) {
    // inventory
    for (var name in Memory.creeps) {

      // clean memory for died creep
      var creep = Game.creeps[name];
      if (!creep) {
        console.log('Clearing non-existing creep memory:', name);
        delete Memory.creeps[name];
      } else {

        // bug @ createCreep Workaround
        if (!creep.memory.id)
          creep.memory.id = creep.id; 

        // creep is assigned to source
        if( creep.memory.source != null && creep.room.memory.sources[creep.memory.source])
          creep.room.memory.sources[creep.memory.source].creeps.push(creep.id);

        if (creep.memory.role == 'harvester') {
          creep.room.memory.creeps.harvester += creep.memory.cost;
        }
        if (creep.memory.role == 'upgrader') {
          creep.room.memory.creeps.upgrader += creep.memory.cost;
        }
        if (creep.memory.role == 'builder') {
          creep.room.memory.creeps.builder += creep.memory.cost;
        }
      }
    }
    // assign role behaviour
    for (var name in Memory.creeps) {
      var hasRole = false;
      var creep = Game.creeps[name];
                
        if(!creep.memory.role) {
          var nextRole = strategy.nextRole(creep.room);
          this.role.worker.run(creep);
          creep.room.memory.creeps[nextRole[iRole].role] += creep.memory.cost;
          creep.memory.role = nextRole[iRole].role;
        }
      }
  }
}

module.exports = creeps;