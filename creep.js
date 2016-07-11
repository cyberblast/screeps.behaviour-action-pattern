var mod = {
  behaviour: {
    worker: require('creep.behaviour.worker')
  },
  loop: function () {
    for(var creepName in Memory.creeps){
        var creep = Game.creeps[creepName];
        if (!creep) {
            console.log(Memory.creeps[creepName].mother + ' > Good night ' + creepName + '!');
            delete Memory.creeps[creepName];
        } else {
            var behaviour = this.behaviour[creep.memory.setup];
            if(!creep.spawning) behaviour.run(creep);
        }
    }
  }
}

module.exports = mod;