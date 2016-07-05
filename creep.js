var creeps = {
  behaviour: {
    worker: require('creep.behaviour.worker')
  },
  loop: function (state) {
    state.rooms.forEach(function(room){
        room.creepId.forEach(function(creepId) {

            var creep = Game.getObjectById(creepId);
            var behaviour = creeps.behaviour[state.memory.creeps[creep.name].setup];
            behaviour.drive(creep, state, roomId);            
        }); 
    });
  }
}

module.exports = creeps;