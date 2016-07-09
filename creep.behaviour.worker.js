var work = {
    actions: {
        harvesting: require('creep.action.harvesting'), 
        upgrading: require('creep.action.upgrading'), 
        building: require('creep.action.building'), 
        storing: require('creep.action.storing'), 
        repairing: require('creep.action.repairing')
    },
    run: function(creep) {debugger;
        // Last Action completed / No more energy
	    if( creep.carry.energy == 0 && creep.memory.action != 'harvesting') { 
            creep.memory.action = 'harvesting';
            creep.memory.target = null;
	    }

        // Harvesting completed / energy refilled
	    else if(creep.memory.action == 'harvesting' && creep.carry.energy == creep.carryCapacity) { 
            creep.memory.action = null;
            creep.memory.target = null;
	    } 

        // Has assigned Action
        if( creep.memory.action ){
            creep.action = this.actions[creep.memory.action];
            
            // take target from memory
            if( creep.memory.target != null ) {
                creep.target = creep.action.getTargetById(creep.memory.target);
            }
                
            // validate target or new
            if( !creep.action.isValidTarget(creep.target) ){ 
                // invalid. try to find a new one...
                creep.target = creep.action.newTarget(creep);
            }
            
            if( creep.target ){
                // target ok. memorize
                creep.memory.target = creep.action.getTargetId(creep.target);
            }
            else {
                // no more valid target found for old memorized action!
                creep.memory.action = null;
                creep.memory.target = null;
                creep.action = null;
                creep.target = null;
            }
        }
        
        // Assign next Action
        if( !creep.action ) {
            this.nextAction(creep);
        }

        // Do some work
        if( creep.action && creep.target ) {
            if( !creep.target.creeps ) 
                creep.target.creeps = [];
            creep.target.creeps.push(creep.name);
            creep.memory.step = creep.action.step(creep);
            // TODO: Update State

        } else {
            // action.error.noTarget(creep);
            this.idle(creep);
        }
    }, 
    nextAction: function(creep){
        creep.memory.target = null;
        creep.target = null;
        var maxPerJob = _.max([3,creep.room.creeps.length/3]);
        
        // urgent upgrading 
        if( creep.room.ticksToDowngrade < 2000 ) {
            if( this.assignAction(creep, this.actions.upgrading) ) 
                return;
        }
        
        // Storing
        if( creep.room.energyAvailable < creep.room.energyCapacityAvailable && 
        (!creep.room.activities.storing || creep.room.activities.storing < maxPerJob)) {
            if( this.assignAction(creep, this.actions.storing) ) 
                return;
        }
        
        // Building
        if( creep.room.constructionSites.count > 0 && 
        (!creep.room.activities.building || creep.room.activities.building < maxPerJob)) { 
            if( this.assignAction(creep, this.actions.building) ) 
                return;
        }
        
        // Repairing
        if( creep.room.creepRepairableSites.count > 0 && 
        (!creep.room.activities.repairing || creep.room.activities.repairing < maxPerJob)){
            if( this.assignAction(creep, this.actions.repairing) ) 
                return;
        }
        
        // Default: upgrading
        this.assignAction(creep, this.actions.upgrading);
    }, 
    assignAction: function(creep, action){
        creep.action = action;
        creep.target = action.newTarget(creep);
        
        if( creep.target ) {
            creep.memory.action = action.name;
            creep.memory.target = action.getTargetId(creep.target);
            return true;
        } 
        
        creep.action = null;
        creep.target = null;
        return false;
    },
    idle: function(creep){
        console.log('idle creep!')
        creep.memory.action = null;
        creep.memory.target = null;
        creep.action = null;
        creep.target = null;
        // Move away from source etc...
        var idlePole = Game.flags['IdlePole'];
        if(idlePole) creep.moveTo(idlePole);
    }
};

module.exports = work;