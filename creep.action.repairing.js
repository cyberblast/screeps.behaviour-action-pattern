var mod = {

    name: 'repairing',
    
    getTargetId: function(target){ 
        return target.id;
    },

    getTargetById: function(id){
        return Game.getObjectById(id);
    },

    isValidAction: function(creep){
        return (creep.carry.energy > 0 && creep.room.creepRepairableSites.count > 0 );
    },

    isValidTarget: function(target){
        return ( target != null && target.hits != null && target.hits < target.hitsMax && (target.id in target.room.repairableSites || target.hits < LIMIT_CREEP_REPAIRING));
    }, 

    isAddableAction: function(creep){
        return (!creep.room.activities[this.name] || creep.room.activities[this.name] < creep.room.maxPerJob);
    },

    isAddableTarget: function(target){ // target is valid to be given to an additional creep
        return (!target.creeps || target.creeps.length < 1);
    }, 

    newTarget: function(creep){
        var room = creep.room;
        var site = null;
        
        room.creepRepairableSites.order.every(id => {
            if( this.isAddableTarget(room.creepRepairableSites[id]) ){
                site = room.creepRepairableSites[id];
                return false;
            }
            return true;
        });
        
        return site;
    }, 

    step: function(creep){      
        if( !this.isValidTarget(creep.target)) {
            creep.memory.action = null;
            creep.memory.target = null;
            return;
        }
        var moveResult = creep.moveTo(creep.target);
        var workResult = creep.repair(creep.target);
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