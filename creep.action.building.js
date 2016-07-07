var mod = {

    getTargetId: function(target){ 
        return target.id;
    },

    getTargetById: function(id){
        return Game.getObjectById(id);
    },

    isValidTarget: function(target){
        return target && target.progress;
    }, 

    newTarget: function(creep, state){
        var roomSites = state.rooms[creep.room.name].constructionSites;
        var targetId = null;
        var completion = -1;
        for( var newTargetId in roomSites ) {
            var site = roomSites[newTargetId];
            if( site.creeps.length+1 <= site.maxCreeps && site.completion > completion){
                targetId = site.id;
                completion = site.completion;
            }
        }
        return Game.getObjectById(targetId);
    }, 

    step: function(creep, target){       
        if(creep.build(target) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
            return "moveTo";
        }return "build";
    }, 

    error: {
        noTarget: function(creep, state){
            if(state.debug) console.log( creep.name + ' > "There is nothing to build."');
        }
    }
}

module.exports = mod;