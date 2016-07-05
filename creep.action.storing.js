var mod = {
    run: function(creep, state){
        creep.memory.action = 'storing';   
        
        var targets = creep.room.find(FIND_MY_SPAWNS, {
                filter: (structure) => {
                    return structure.energy < structure.energyCapacity;
                }
        });
        if(targets.length > 0) {
            if(creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(targets[0]);
            }
            return true;
        } 
        
        targets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_EXTENSION  && structure.energy < structure.energyCapacity);
                }
        });
        if(targets.length > 0) {
            if(creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(targets[0]);
            }
            return true;
        } 
        
        targets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_TOWER && structure.energy < structure.energyCapacity);
                }
        });
        if(targets.length > 0) {
            if(creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(targets[0]);
            }
            return true;
        } 
        
        
        creep.memory.action = null;
        return false;
        
    }
}

module.exports = mod;