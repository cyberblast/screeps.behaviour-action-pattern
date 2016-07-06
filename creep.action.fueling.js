var mod = {

    getTargetId: function(target){ 
        return target.id;
    },

    getTargetById: function(id){
        return Game.getObjectById(id);
    },

    isValidTarget: function(target){
        return (target && target.energy && target.energy < target.energyCapacity);
    }, 

    newTarget: function(creep, state){ 
        // TODO: find initial in STATE
        targets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_TOWER && structure.energy < structure.energyCapacity);
                }
        });
        if(targets.length > 0) {
            return targets[0];
        } 
        return null;
        /* // Not required for towers... (expensive)
        if( !target ){
            target = creep.findClosestByPath(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_TOWER && structure.energy < structure.energyCapacity);
                }
            });
        }*/
    }, 

    step: function(creep, target){    
        if(creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
        }
    }, 

    error: {
        noTarget: function(creep, state){
            if(state.debug) console.log( creep.name + ' > "There\'s nothing to fuel."');
        }
    }
}

module.exports = mod;