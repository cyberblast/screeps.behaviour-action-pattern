var creeps = {
  behaviour: {
    worker: require('creep.behaviour.worker')
  },
  loop: function (state) {
    for(var creepName in Game.creeps){
        var behaviour = creeps.behaviour[state.memory.creeps[creepName].setup];
        behaviour.run(Game.creeps[creepName], state);
    }
  }
}

module.exports = creeps;