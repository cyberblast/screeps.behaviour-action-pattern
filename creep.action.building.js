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
            var closestDamagedStructure = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (structure) => structure.hits < structure.hitsMax
            });
        
            if(closestDamagedStructure) {
                if(creep.repair(closestDamagedStructure) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(closestDamagedStructure);
                }
            }
            return true;
        } 
        creep.memory.action = null;
        return false;
	}
}

module.exports = mod;