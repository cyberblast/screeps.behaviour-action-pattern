var mod = {

    name: 'provisioning',
    
    getTargetId: function(target){ 
        //if(target.name) return target.name;
        return target.id;
    },

    getTargetById: function(id){
        var obj = Game.getObjectById(id);
        if( !obj ) obj = Game.spawns[id];
        return obj;
    },

    isValidAction: function(creep){
        return ( creep.carry.energy < creep.carryCapacity && (creep.room.energyAvailable < creep.room.energyCapacityAvailable || creep.room.towerFreeCapacity > 500 ));
    },

    isAddableAction: function(creep){
        return (!creep.room.activities[this.name] || creep.room.activities[this.name] < creep.room.maxPerJob);
    },

    isValidTarget: function(target){
        return ( (target != null) && (target.store != null) && (target.store.energy > 0) );
    }, 

    isAddableTarget: function(target){ // target is valid to be given to an additional creep
        return (!target.creeps || target.creeps.length < 2);
    }, 

    newTarget: function(creep){ 
        return creep.room.storage;
    }, 

    step: function(creep){   
        var moveResult = creep.moveTo(creep.target);
        var workResult = creep.target.transfer(creep, RESOURCE_ENERGY);
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