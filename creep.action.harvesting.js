var mod = {

    getTargetId: function(target){ 
        return target.id;
    },

    getTargetById: function(id){
        return Game.getObjectById(id);
    },

    isValidTarget: function(target){
        return (target && target.energy && target.energy > 0);
    }, 

    newTarget: function(creep, state){ 
        /*
        var roomSources = state.rooms[creep.room.name].sources;
        var targetId = null;
        var energy = -1;
        var assigned = 999;
        // TODO: gleichmaessig verteilen?
        for( var newTargetId in roomSources ) {
            var site = roomSources[newTargetId];
            if( site.creeps.length+1 <= site.maxCreeps // source is not crowded 
                && site.creeps.length < assigned // has less creeps digging
                && site.energy > 0 ){ // is not empty
                targetId = site.id;
                energy = site.energy;
                assigned = site.creeps.length;
                state.rooms[creep.room.name].sources[newTargetId].creeps.push(creep.id);
            }
        }
        return Game.getObjectById(targetId);     
        */
        
        var roomSources = state.rooms[creep.room.name].sources;
        return creep.pos.findClosestByPath(FIND_SOURCES, {
            filter: function(object){ 
                return object.energy > 0 && (!roomSources[object.id] || roomSources[object.id].creeps.length+1 <= roomSources[object.id].maxCreeps); 
            }
        });   
    }, 

    step: function(creep, target){      
        if(creep.harvest(target) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
            return "moveTo";
        } return "harvest";
    }, 

    error: {
        noTarget: function(creep, state){
            if(state.debug) console.log( creep.name + ' > "Energy sources are overcrowded! :("');
        }
    }
}

module.exports = mod;