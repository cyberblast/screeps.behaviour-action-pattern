var mod = {

    name: 'pickup',
    
    getTargetId: function(target){ 
        return target.id;
    },

    getTargetById: function(id){
        return Game.getObjectById(id);
    },

    isValidAction: function(creep){
        return ( _.sum(creep.carry) < creep.carryCapacity );
    },

    isValidTarget: function(target){
        return (target != null && target.amount != null && target.amount > 0);
    }, 

    isAddableAction: function(creep){
        return (!creep.room.activities[this.name] || creep.room.activities[this.name] < creep.room.maxPerJob);
    },

    isAddableTarget: function(target){ // target is valid to be given to an additional creep
        return (!target.creeps || target.creeps.length < 2);
    }, 

    newTarget: function(creep){ 
        var target = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
            filter: (o) => this.isAddableTarget(o)
        });
        if( target == null ) target = creep.pos.findClosestByPath(FIND_DROPPED_ENERGY, {
            filter: (o) => this.isAddableTarget(o)
        });
        return target;
    }, 

    step: function(creep){       
        var moveResult = creep.moveTo(creep.target);
        var workResult = creep.pickup(creep.target);
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