var roleHarvester = {
    actions: {
        upgrading: require('creep.action.upgrading'), 
        building: require('creep.action.building'), 
        storing: require('creep.action.storing'), 
        harvesting: require('creep.action.harvesting')
    },
    run: function(creep) {
        
	    if((creep.memory.action == 'upgrading' || creep.memory.action == 'storing' || creep.memory.action == 'building') && creep.carry.energy == 0) { 
            // finished work, get some energy
            creep.memory.action = 'harvesting';
            //creep.memory.role = null;
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
            if(creep.memory.cost)
                creep.room.memory.creeps[creep.memory.role] -= creep.memory.cost;
            creep.memory.action = null;
            creep.memory.role = null;
            return false;
	    } 

        if(creep.memory.action == null){
            if( creep.carry.energy < creep.carryCapacity ) creep.memory.action = 'harvesting';
            else if( creep.memory.role == 'builder') creep.memory.action = 'building';
            else if( creep.memory.role == 'harvester') creep.memory.action = 'storing';
            else if( creep.memory.role == 'upgrader') creep.memory.action = 'upgrading';
        }

        if(creep.memory.action == 'harvesting'){
            return this.actions.harvesting.run(creep); 
        }

        var busy = true;
        if(creep.memory.action == 'storing' || !busy)
            busy = this.actions.storing.run(creep);

        if(creep.memory.action == 'building' || !busy)
            busy = this.actions.building.run(creep);

        if(creep.memory.action == 'upgrading' || !busy)
            busy = this.actions.upgrading.run(creep);

        return busy;
	}
};

module.exports = roleHarvester;