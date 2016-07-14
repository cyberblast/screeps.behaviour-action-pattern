var mod = {

    name: null,
    
    getTargetId: function(target){ 
        return target.id || target.name;
    },

    getTargetById: function(id){
        return Game.getObjectById(id) || Game.spawns[id];
    },

    isValidAction: function(creep){
        return true;
    },

    isValidTarget: function(target){
        return (target != null);
    }, 

    newTarget: function(creep){
        return null;
    }, 

    isAddableAction: function(creep){
        return (!creep.room.activities[this.name] || creep.room.activities[this.name] < creep.room.maxPerJob);
    },
    maxPerTarget: 1,
    isAddableTarget: function(target){ // target is valid to be given to an additional creep
        return (!target.creeps || target.creeps.length < this.maxPerTarget);
    }, 

    step: function(creep){     
        if(CHATTY) creep.say(this.name);
        var moveResult = creep.moveTo(creep.target);
        var workResult = this.work(creep);
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
    }, 
    
    work: function(creep){
        return ERR_INVALID_ARGS;
    }
}

module.exports = mod;