var mod = {

    name: 'harvesting',
    
    getTargetId: function(target){ 
        return target.id;
    },

    getTargetById: function(id){
        return Game.getObjectById(id);
    },

    isValidTarget: function(target){
        return (target && target.energy && target.energy > 0) && (!target.creeps || target.creeps.length < target.accessibleFields+2);
    }, 

    newTarget: function(creep){ 
        // TODO: Nicht naheste Quelle, sondern vollste??? 
        return creep.pos.findClosestByPath(FIND_SOURCES, {
            filter: function(source){ 
                return source.energy > 0 && source.creeps.length < source.accessibleFields+2; 
            }
        });   
    }, 

    step: function(creep){      
        if(creep.harvest(creep.target) == ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.target);
            return "moveTo";
        } return "harvest";
    }, 

    error: {
        noTarget: function(creep){
            if(DEBUG) console.log( creep.name + ' > "Energy sources are overcrowded! :("');
        }
    }
}

module.exports = mod;