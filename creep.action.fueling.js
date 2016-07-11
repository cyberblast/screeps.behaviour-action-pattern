var mod = {

    name: 'fueling',
    
    getTargetId: function(target){ 
        if(target.name) return target.name;
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

    isValidTarget: function(target){
        return (target && target.energy && target.energy < target.energyCapacity) && (!target.creeps || target.creeps.length < 2);
    }, 

    isAddableAction: function(creep){
        return (!creep.room.activities[this.name] || creep.room.activities[this.name] < creep.room.maxPerJob);
    },

    newTarget: function(creep){ 
        var target = null;
        var room = creep.room;
        room.towers.every(tower => { // TODO: include Nuker
            if( this.isValidTarget(tower) ){
                target = tower;
                return false;
            }
            return true;
        });
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