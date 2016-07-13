var mod = {

    name: 'fueling',
    
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
        //console.log('creep.room.towerFreeCapacity ' + creep.room.towerFreeCapacity + ' creep.room.activities.fueling ' + creep.room.activities.fueling );
        return ( creep.carry.energy > 0 && creep.room.towerFreeCapacity > 0 );
    },

    isAddableAction: function(creep){
        return (!creep.room.activities[this.name] || creep.room.activities[this.name] < creep.room.maxPerJob);
    },
    
    isValidTarget: function(target){
        return (target != null && target.energy != null && target.energy < target.energyCapacity);
    }, 

    isAddableTarget: function(target){ // target is valid to be given to an additional creep
        return (!target.creeps || target.creeps.length < 1);
    }, 

    newTarget: function(creep){ 
        var target = null;
        var room = creep.room;
        room.towers.every(tower => { // TODO: include Nuker
            if( this.isValidTarget(tower) && this.isAddableTarget(tower) ){
                target = tower;
                return false;
            }
            return true;
        });
        return target;
    }, 

    step: function(creep){      
        var moveResult = creep.moveTo(creep.target);
        var workResult = creep.transfer(creep.target, RESOURCE_ENERGY);
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