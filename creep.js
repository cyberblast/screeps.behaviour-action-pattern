var creeps = {
  behaviour: {
    worker: require('creep.behaviour.worker')
  },
  loop: function (state) {
    state.rooms.foreach(
      room => function(room){
        room.creepId.foreach(
          creepId => function(creepId) {

            var creep = Game.getObjectById(creepId);
            var behaviour = creeps.behaviour[state.memory.creeps[creep.name].setup];
            behaviour.drive(creep, state, roomId);            
          }
        );
      }
    );
  }
}

module.exports = creeps;