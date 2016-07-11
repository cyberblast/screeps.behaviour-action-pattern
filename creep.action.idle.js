var mod = {

    name: 'pickup',
    
    getTargetId: function(target){ 
        return target.id;
    },

    getTargetById: function(id){
        return Game.getObjectById(id);
    },

    isValidAction: function(creep){
        return ( creep.carry.energy < creep.carryCapacity );
    },

    isValidTarget: function(target){
        return (target && target.amount && (!target.creeps || target.creeps < 1));
    }, 

    isAddableAction: function(creep){
        return (!creep.room.activities[this.name] || creep.room.activities[this.name] < creep.room.maxPerJob);
    },

    newTarget: function(creep){ 
        var target = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES);
        if( target == null ) target = creep.pos.findClosestByPath(FIND_DROPPED_ENERGY);
        return target;
    }, 

    step: function(creep){      
        var result;
        if( creep.pickup(creep.target) == ERR_NOT_IN_RANGE ) {
            creep.moveTo(creep.target);
            return "moveTo";
        }
        if ( result == OK ) {
            return "harvest";
        }
            
        this.error(creep, result);
        creep.memory.action = null;
        creep.memory.target = null;
        return 'error';
    }, 

    error: function(creep, code) {
        console.log( creep.name + ' > Failed ' + this.name + ' (' + errorCode(code) + ')\ntarget: ' + creep.memory.target);
    }
}

module.exports = mod;