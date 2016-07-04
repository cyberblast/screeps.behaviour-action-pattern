var roleHarvester = {
    actions: {
        storing: require('creep.action.storing'), 
        harvest: require('creep.action.harvesting')
    },
    run: function(creep) {
        
	    if(creep.memory.action == 'storing' && creep.carry.energy == 0) { 
            // finished storing, reassign role
            creep.memory.action = null;
            creep.memory.role = null;
            return false;
	    }
	    if(creep.memory.action == 'harvesting' && creep.carry.energy == creep.carryCapacity) { 
            // finished harvesting
            // clear harvest source target
            if( creep.memory.source != null){ 
                if(creep.room.memory.sources[creep.memory.source]) {
                    var index = creep.room.memory.sources[creep.memory.source].creeps.indexOf(creep.id);
                    if( index > -1 ) creep.room.memory.sources[creep.memory.source].creeps.splice(index);
                }
                creep.memory.source = null;
	        }
            return this.actions.storing.run(creep);
	    } else {
            // energy required   
            return this.actions.harvesting.run(creep);
        }
	}
};

module.exports = roleHarvester;