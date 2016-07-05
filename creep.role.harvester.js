var roleHarvester = {
    actions: {
        upgrading: require('creep.action.upgrading'), 
        building: require('creep.action.building'), 
        storing: require('creep.action.storing'), 
        harvesting: require('creep.action.harvesting')
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
            
            if( !this.actions.storing.run(creep) ) {
                if( !this.actions.building.run(creep) ) {
                    if( !this.actions.upgrading.run(creep) ){
                        console.log(creep.name + ' idle!');
                    }
                }
            }
	    } else {
            // energy required   
            this.actions.harvesting.run(creep);
        }
        return true;
	}
};

module.exports = roleHarvester;