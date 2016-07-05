var mod = {
    run: function(creep, state){
        creep.memory.action = 'upgrading';
        var ramparts = creep.room.find();
        // Todo: first upgrade ramparts to same level of controller
        if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.room.controller);
        }
        return true;
    }
}

module.exports = mod;