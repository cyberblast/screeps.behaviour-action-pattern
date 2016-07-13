var mod = {

    name: 'harvesting',
    
    getTargetId: function(target){ 
        return target.id;
    },

    getTargetById: function(id){
        return Game.getObjectById(id);
    },

    isValidAction: function(creep){ // Action is valid for any creep
        return ( creep.carry.energy < creep.carryCapacity && creep.room.sourceEnergyAvailable > 0 && (creep.memory.action == 'harvesting' || creep.carry.energy == 0));
    },

    isAddableAction: function(creep){ // Action is valid to be given to an additional creep
        return true;
    },
    
    isValidTarget: function(target){ //target is valid for any creeps target (with this action)
        return (target != null && target.energy != null && target.energy > 0);
    }, 

    isAddableTarget: function(target){ // target is valid to be given to an additional creep
        return (!target.creeps || ( !target.accessibleFields && target.creeps.length < 1 ) || target.creeps.length < target.accessibleFields*1.5);
    }, 

    newTarget: function(creep){ 
        var target = null;
        var sourceGuests = 999;
        for( var iSource = 0; iSource < creep.room.sources.length; iSource++ ){
            var source = creep.room.sources[iSource];
            if( this.isValidTarget(source) && this.isAddableTarget(source) && (source.creeps == null || source.creeps.length < sourceGuests )){
                sourceGuests = source.creeps == null ? 0 : source.creeps.length;
                target = source;
            }
        }
        /*
        if( target == null && creep.room.storage && creep.room.storage.store.energy > 0){
            target = creep.room.storage;
        }*/
        //if( target == null && DEBUG ) logError(creep, ERR_NOT_FOUND);
        return target;
    }, 

    step: function(creep){      
        var moveResult = creep.moveTo(creep.target);
        var workResult = creep.harvest(creep.target);
        if(workResult == OK || moveResult == OK)
            return;
        
        if( moveResult == ERR_NO_PATH && Game.flags['IdlePole']){
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