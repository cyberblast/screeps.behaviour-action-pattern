var creeps = {
  behaviour: {
    worker: require('creep.behaviour.worker')
  },
  loop: function () {
    for(var creepName in Game.creeps){
        var creep = Game.creeps[creepName];
        var behaviour = creeps.behaviour[creep.memory.setup];
        behaviour.run(creep);
    }
  }
}

module.exports = creeps;