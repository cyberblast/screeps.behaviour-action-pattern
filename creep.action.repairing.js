var mod = {

    getTargetId: function(target){ 
        return target.id;
    },

    getTargetById: function(id){
        return Game.getObjectById(creep.memory.target);
    },

    isValidTarget: function(target){
        return (target && target.hits && target.hits < target.hitsMax);
    }, 

    newTarget: function(creep, state){
        var roomSites = state.rooms[creep.room.name].repairableSites;
        var targetId = null;
        var damage = -1;
        for( var newTargetId in roomSites ) {
            var site = roomSites[newTargetId];
            if( site.creeps.length+1 <= site.maxCreeps && site.damage > damage){
                targetId = site.id;
                damage = site.damage;
            }
        }
        return Game.getObjectById(targetId);
    }, 

    step: function(creep, target){       
        if(creep.repair(target) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
        } 
    }, 

    error: {
        noTarget: function(creep, state){
            if(state.debug) console.log( creep.name + ' > "There\'s nothing to repair."');
        }
    }
}

module.exports = mod;