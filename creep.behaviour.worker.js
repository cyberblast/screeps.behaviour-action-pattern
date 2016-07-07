var work = {
    actions: {
        harvesting: require('creep.action.harvesting'), 
        upgrading: require('creep.action.upgrading'), 
        building: require('creep.action.building'), 
        storing: require('creep.action.storing'), 
        fueling: require('creep.action.fueling'),
        repairing: require('creep.action.repairing')
    },
    run: function(creep, state) {
        
        // Last Action completed / No more energy
	    if( creep.carry.energy == 0 && creep.memory.action != 'harvesting') { 
            this.workCompleted(creep);
	    }

        // Harvesting completed / energy refilled
	    else if(creep.memory.action == 'harvesting' && creep.carry.energy == creep.carryCapacity) { 
            this.energyRefilled(creep);
	    } 

        // Assign next Action
        var actionName = creep.memory.action;
        if(!actionName){
            actionName = this.assignAction(creep, state);
        }

        if( actionName ) {
            var action = this.actions[actionName];
            var target = null;

            // Validate target from memory
            if( creep.memory.target != null ) {
                // get 'name'd and generic 'id'entified items
                target = action.getTargetById(creep.memory.target);
                if( !action.isValidTarget(target) ){ 
                    target = null;
                    creep.memory.target = null;
                }
            }

            // Assign new target
            if( !target ) {
                target = action.newTarget(creep, state);
            }

            // Do some work
            if( target ){
                creep.memory.target = action.getTargetId(target);
                creep.memory.step = action.step(creep, target);
                // TODO: Update State

            // No Valid Target
            } else {
                action.error.noTarget(creep, state);
                this.idle(creep);
            }
        }
    }, 
    workCompleted: function(creep){
        creep.memory.action = 'harvesting';
        creep.memory.target = null;
    }, 
    energyRefilled: function(creep){
        // TODO: Update state, remove creep from old targets register
        creep.memory.action = null;
        creep.memory.target = null;
    }, 
    assignAction: function(creep, state){
        //if( creep.carry.energy < creep.carryCapacity ) // need energy
        //    creep.memory.action = 'harvesting';
        //else { // energy full
            var action = null;
            var required = -1;
            for( var iAction in state.rooms[creep.room.name].creepActionRequirement) {
                var newRequired = state.rooms[creep.room.name].creepActionRequirement[iAction];
                if( newRequired > required ){
                    required = newRequired;
                    action = iAction;
                }
            }
            creep.memory.action = action;
        //}
        return action;
    }, 
    idle: function(creep){
        creep.memory.action = null;
        creep.memory.target = null;
        // Move away from source etc...
        var idlePole = Game.flags['IdlePole'];
        if(idlePole) creep.moveTo(idlePole);
    }
};

module.exports = work;