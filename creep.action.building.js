var mod = {
    
    name: 'building',

    getTargetId: function(target){ 
        return target.id;
    },

    getTargetById: function(id){
        return Game.getObjectById(id);
    },
    
    isValidAction: function(creep){
        return ( creep.carry.energy > 0 && creep.room.constructionSites.count > 0 );
    },

    isValidTarget: function(target){
        return (target != null && target.progress != null && target.id in target.room.constructionSites);
    }, 
    
    isAddableAction: function(creep){
        return (!creep.room.activities[this.name] || creep.room.activities[this.name] < creep.room.maxPerJob);
    },

    isAddableTarget: function(target){ // target is valid to be given to an additional creep
        return target.creeps.length < 3;
    }, 

    newTarget: function(creep){
        var room = creep.room;
        var site = null;
        room.constructionSites.order.every(id => {
            if( this.isAddableTarget(room.constructionSites[id]) ){
                site = room.constructionSites[id];
                return false;
            }
            return true;
        });
        return site;
    }, 

    step: function(creep){        
        var moveResult = creep.moveTo(creep.target);
        var workResult = creep.build(creep.target);
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