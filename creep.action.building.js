var mod = {
    run: function(creep){
        creep.memory.action = 'building';            
        var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
        if(targets.length) {
            if(creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
                creep.moveTo(targets[0]);
            }
            return true;
        } else {
            creep.memory.action = null;
            return false;
        }
	}
}

module.exports = mod;