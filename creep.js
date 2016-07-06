var creeps = {
  behaviour: {
    worker: require('creep.behaviour.worker')
  },
  loop: function (state) {
    state.roomId.forEach(function(roomName){
        var room = state.rooms[roomName];
        room.creepId.forEach(function(creepId) {

            var creep = Game.getObjectById(creepId);
            var behaviour = creeps.behaviour[state.memory.creeps[creep.name].setup];
            behaviour.drive(creep, state, roomName);            
        }); 
    });
  }
}

module.exports = creeps;