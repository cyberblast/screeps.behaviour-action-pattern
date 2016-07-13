var behaviour = {
  common: {
    worker: require('creep.behaviour.worker'),
    defender: require('creep.behaviour.defender')
  },
  noEnergy: {
    worker: require('creep.behaviour.worker.noEnergy'),
    defender: require('creep.behaviour.defender')
  },
  defense: {
    worker: require('creep.behaviour.worker.defense'),
    defender: require('creep.behaviour.defender.defense')
  },
  defenseNoEnergy: {
    worker: require('creep.behaviour.worker.defenseNoEnergy'),
    defender: require('creep.behaviour.defender.defense')
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
            
                if( creep.room.find(FIND_HOSTILE_CREEPS).length > 0){
                    if( creep.room.sourceEnergyAvailable == 0 )
                        behaviour.defenseNoEnergy[creep.memory.setup].run(creep);
                    else 
                        behaviour.defense[creep.memory.setup].run(creep);
                }
                else if( creep.room.sourceEnergyAvailable == 0 )
                    behaviour.noEnergy[creep.memory.setup].run(creep);
                else 
                    behaviour.common[creep.memory.setup].run(creep);
        }
    }
  }
}

module.exports = mod;