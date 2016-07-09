var mod = {

    name: 'storing',
    
    getTargetId: function(target){ 
        if(target.name) return target.name;
        return target.id;
    },

    getTargetById: function(id){
        var obj = Game.getObjectById(id);
        if( !obj ) obj = Game.spawns[id];
        return obj;
    },

    isValidTarget: function(target){
        return (target && target.energy && target.energy < target.energyCapacity) && (!target.creeps || target.creeps.length < 3);
    }, 

    newTarget: function(creep){ 
        var target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType == STRUCTURE_EXTENSION || 
                    structure.structureType == STRUCTURE_SPAWN ) 
                    && structure.energy < structure.energyCapacity;
            }
        });
        if( !target ) {
            target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_TOWER || 
                        structure.structureType == STRUCTURE_NUKER ) 
                        && structure.energy < structure.energyCapacity;
                }
            });
        }

        return target;
    }, 

    step: function(creep){    
        if(creep.transfer(creep.target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.target);
            return "moveTo";
        } return "transfer";
    }, 

    error: {
        noTarget: function(creep, state){
            if(DEBUG) console.log( creep.name + ' > "Can not store energy."');
        }
    }
}


module.exports = mod;