var work = {
    actions: {
        upgrading: require('creep.action.upgrading'), 
        building: require('creep.action.building'), 
        storing: require('creep.action.storing'), 
        harvesting: require('creep.action.harvesting')
    },
    drive: function(creep, state, roomId) {
        var creepMemory = creep.memory;
        
	    if((creepMemory.action == 'upgrading' || creepMemory.action == 'storing' || creepMemory.action == 'building') && creep.carry.energy == 0) { 
            // finished work, get some energy
            creepMemory.action = 'harvesting';
            creepMemory.target = null;
            creepMemory.targetType = null;
	    }
	    else if(creepMemory.action == 'harvesting' && creep.carry.energy == creep.carryCapacity) { 
            // finished harvesting
            // TODO: Update State
            creepMemory.action = null;
            creepMemory.target = null;
            creepMemory.targetType = null;
	    } 

        if(creepMemory.action == null){
            if( creep.carry.energy < creep.carryCapacity ) 
                creepMemory.action = 'harvesting';
            else {debugger;
                var action;
                var required = -1;
                for( var iAction in state.rooms[roomId].creepActionRequirement) {
                    var newRequired = state.rooms[roomId].creepActionRequirement[iAction];
                    if( newRequired > required ){
                        required = newRequired;
                        action = iAction;
                    }
                }
                creepMemory.action = action;
            }
        }
        creep.memory = creepMemory;

        if(creepMemory.action == 'harvesting'){
            this.actions.harvesting.run(creep, state);
            return; 
        }

        var busy = true;
        if(creepMemory.action == 'storing' || !busy)
            busy = this.actions.storing.run(creep, state);

        if(creepMemory.action == 'building' || !busy)
            busy = this.actions.building.run(creep, state);

        if(creepMemory.action == 'upgrading' || !busy)
            busy = this.actions.upgrading.run(creep, state);
	}
};

module.exports = work;