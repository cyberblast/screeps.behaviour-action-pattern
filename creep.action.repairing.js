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
        return target && target.hits && target.hits < target.hitsMax && target.id in target.room.repairableSites && (!target.creeps || target.creeps.length < 1);
    }, 

    isAddableAction: function(creep){
        return (!creep.room.activities[this.name] || creep.room.activities[this.name] < creep.room.maxPerJob);
    },

    newTarget: function(creep){
        var room = creep.room;
        var site = null;
        
        room.creepRepairableSites.order.every(id => {
            if( room.creepRepairableSites[id].creeps.length < 3 ){
                site = room.creepRepairableSites[id];
                return false;
            }
            return true;
        });
        
        return site;
    }, 

    step: function(creep){       
        if(creep.repair(creep.target) == ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.target);
            return "moveTo";
        } return "repair";
    }, 

    error: {
        noTarget: function(creep){
            if(DEBUG) console.log( creep.name + ' > "There is nothing to repair."');
        }
    }
}

module.exports = mod;