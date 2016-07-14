var mod = {

    name: 'storing',
    
    getTargetId: function(target){ 
        return target.id || target.name;
    },

    getTargetById: function(id){
        return Game.getObjectById(id) || Game.spawns[id];
    },

    isValidAction: function(creep){
        return ( _.sum(creep.carry) > 0 && creep.room.storage != null && 
        ( _.sum(creep.carry) > creep.carry.energy || (
        (creep.room.activities.upgrading != null && (creep.room.activities.upgrading >= 2)) &&
        creep.room.sourceEnergyAvailable > 0)));
    },

    isAddableAction: function(creep){
        return (!creep.room.activities[this.name] || creep.room.activities[this.name] < creep.room.maxPerJob);
    },

    isValidTarget: function(target){
        return ((target != null) && (target.store != null) && target.sum < target.storeCapacity);
    }, 

    isAddableTarget: function(target){ 
        return (target.creeps == null || target.creeps.length < 2);
    }, 

    newTarget: function(creep){ 
        if( this.isValidTarget(creep.room.storage) && this.isAddableTarget(creep.room.storage) )
            return creep.room.storage;
        return null;
    }, 

    step: function(creep){    
        var moveResult = creep.moveTo(creep.target);
        var workResult;
        for(var resourceType in creep.carry) {
        	workResult = creep.transfer(creep.target, resourceType);
        }
        // var workResult = creep.transfer(creep.target, RESOURCE_ENERGY);
        if(workResult == OK || moveResult == OK)
            return;
        
        if( moveResult == ERR_NO_PATH && Game.flags['IdlePole']){// get out of the way
            creep.moveTo(Game.flags['IdlePole']);
            return;
        } 
        if( !( [ERR_TIRED, ERR_NO_PATH].indexOf(moveResult) > -1 ) ) {
            if( DEBUG ) logError(creep, moveResult);
            creep.memory.action = null;
            creep.memory.target = null;
        }
    }
}


module.exports = mod;