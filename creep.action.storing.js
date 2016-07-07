var mod = {

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
        return (target && target.energy && target.energy < target.energyCapacity);
    }, 

    newTarget: function(creep, state){ 
        var target = creep.pos.findClosestByPath(FIND_MY_SPAWNS, {
            filter: function(object){ 
                return object.energy < object.energyCapacity; 
            }
        });

        if( !target ){
            target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_EXTENSION && structure.energy < structure.energyCapacity);
                }
            });
        }

        return target;
    }, 

    step: function(creep, target){    
        if(creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
            return "moveTo";
        } return "transfer";
    }, 

    error: {
        noTarget: function(creep, state){
            if(state.debug) console.log( creep.name + ' > "Can not store energy."');
        }
    }
}


module.exports = mod;