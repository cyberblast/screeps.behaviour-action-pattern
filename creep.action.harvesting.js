var mod = {

    name: 'harvesting',
    
    getTargetId: function(target){ 
        return target.id;
    },

    getTargetById: function(id){
        return Game.getObjectById(id);
    },

    isValidAction: function(creep){
        return ( creep.carry.energy < creep.carryCapacity && creep.room.sourceEnergyAvailable > 0 && (creep.memory.action == 'harvesting' || creep.carry.energy == 0));
    },

    isValidTarget: function(target){
        var valid = ((!!target) && target.energy && target.energy > 0) && 
            (!target.creeps || ( !target.accessibleFields && target.creeps.length < 1 ) || target.creeps.length < target.accessibleFields*1.5);
            return valid;
    }, 

    isAddableAction: function(creep){
        return true;
    },

    newTarget: function(creep){ 
        var target = null;
        var room = creep.room;
        room.sources.every(source => {
            var valid = this.isValidTarget(source);
            if( valid ){
                target = source;
                return false;
            }
            return true;
        });
        if( target == null && creep.room.storage && creep.room.storage.store.energy > 0){
            target = creep.room.storage;
        }
        if( target == null && DEBUG ) this.error(creep, ERR_NOT_FOUND);
        return target;
    }, 

    step: function(creep){      
        var result;
        if( creep.target.store ){
            result = creep.target.transfer(creep, RESOURCE_ENERGY, _.min([creep.target.store.energy, creep.carryCapacity-(_.sum(creep.carry))]));
        } 
        else result = creep.harvest(creep.target);
        
        if( result == ERR_NOT_IN_RANGE ) {
            result = creep.moveTo(creep.target);
            if ( result != OK ) {
                if( result = ERR_NO_PATH && Game.flags['IdlePole']){
                    creep.moveTo(Game.flags['IdlePole']);
                } else if( DEBUG ) this.error(creep, result);
            }
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