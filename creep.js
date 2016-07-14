var behaviour = {
  common: {
    worker: require('creep.behaviour.worker'),
    defender: require('creep.behaviour.defender'),
    conqueror: require('creep.behaviour.conqueror')
  },
  noEnergy: {
    worker: require('creep.behaviour.worker.noEnergy'),
    defender: require('creep.behaviour.defender'),
    conqueror: require('creep.behaviour.conqueror')
  }
}

var mod = {
  loop: function () {
    for(var creepName in Memory.creeps){
        var creep = Game.creeps[creepName];
        if (!creep) {
            console.log(Memory.creeps[creepName].mother + ' > Good night ' + creepName + '!');
            delete Memory.creeps[creepName];
        } else { 
            if(creep.spawning) return;
            if( !behaviour.common[creep.memory.setup]) return;

            if( creep.room.situation.noEnergy )
                behaviour.noEnergy[creep.memory.setup].run(creep);
            else 
                behaviour.common[creep.memory.setup].run(creep);
        }
    }
  }
}

module.exports = mod;