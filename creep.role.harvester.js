var roleHarvester = {
    actions: {
        upgrading: require('creep.action.upgrading'), 
        building: require('creep.action.building'), 
        storing: require('creep.action.storing'), 
        harvesting: require('creep.action.harvesting')
    },
    run: function(creep) {
        
	    if(creep.memory.action == 'upgrading' || creep.memory.action == 'storing' || creep.memory.action == 'building' && creep.carry.energy == 0) { 
            // finished
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
            creep.memory.action = null;
            creep.memory.role = null;
            return false;
	    } 

        var busy;
        if(creep.memory.action == 'harvesting')
            busy = this.actions.harvesting.run(creep);   
        
        if(creep.memory.action == 'upgrading' || !busy)
            busy = this.actions.upgrading.run(creep);

        else if(creep.memory.action == 'building' || !busy)
            busy = this.actions.building.run(creep);

        else if(creep.memory.action == 'storing' || !busy)
            busy = this.actions.storing.run(creep);

        else if(creep.memory.action == 'harvesting' || !busy)
            busy = this.actions.harvesting.run(creep);

        return busy;
	}
};

module.exports = roleHarvester;