var mod = {
    run: function(creep){
        creep.memory.action = 'upgrading';
        if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.room.controller);
        }
    }
}

module.exports = mod;