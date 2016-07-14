var work = {
    actions: {
        harvesting: require('creep.action.harvesting'), 
        upgrading: require('creep.action.upgrading'), 
        building: require('creep.action.building'), 
        storing: require('creep.action.storing'), 
        repairing: require('creep.action.repairing'),
        feeding: require('creep.action.feeding'),
        fueling: require('creep.action.fueling'),
        idle: require('creep.action.idle'),
        pickup: require('creep.action.pickup'),
        withdrawing: require('creep.action.withdrawing')
    },
    run: function(creep) {
        // Harvesting completed / energy refilled
	    if(creep.memory.action == 'idle' || (_.sum(creep.carry) == creep.carryCapacity && (creep.memory.action == 'harvesting' || creep.memory.action == 'pickup' || creep.memory.action == 'withdrawing'))) {
            creep.memory.action = null;
            creep.memory.target = null;
	    } 

        // Has assigned Action
        if( creep.memory.action ){
            creep.action = this.actions[creep.memory.action];
            
            if( creep.action && creep.action.isValidAction(creep) ){
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
                    // no more valid target found! 
                    if(creep.memory.action == 'harvesting' && creep.carry.energy == 0) {
                        creep.memory.action = 'idle';
                    } else {
	                    creep.room.activities[creep.memory.action]--;
                        creep.memory.action = null;
                        creep.memory.target = null;
                        creep.action = null;
                        creep.target = null;
                    }
                }
            } else {
	            creep.room.activities[creep.memory.action]--;
                creep.memory.action = null;
                creep.memory.target = null;
                creep.action = null;
                creep.target = null;
            }
        }
        
        // Assign next Action
        if( !creep.memory.action ) {
            this.nextAction(creep);
        }

        // Do some work
        if( creep.action && creep.target ) {
            if( !creep.target.creeps ) 
                creep.target.creeps = [];
            if( !(creep.name in creep.target.creeps) ) 
                creep.target.creeps.push(creep.name);
            creep.action.step(creep);
        } 
    }, 
    nextAction: function(creep){
        creep.memory.target = null;
        creep.target = null;
        
        // Last Action completed / No more energy
	    if( creep.carry.energy == 0 && creep.memory.action != 'harvesting' && creep.memory.action != 'pickup' && creep.memory.action != 'withdrawing') { 
	        if( creep.memory.action != null ) creep.room.activities[creep.memory.action]--;
	        
            if( _.sum(creep.carry) > creep.carry.energy ) {
                if( this.assignAction(creep, this.actions.storing) ) 
                    return;
            }
            
            var priority;
            if( creep.room.situation.invasion ) priority = [
                this.actions.withdrawing,
                this.actions.harvesting];
            else priority = [
                this.actions.pickup,
                this.actions.harvesting,
                this.actions.withdrawing];

                
            for(var iAction = 0; iAction < priority.length; iAction++) {
                
                if(priority[iAction].isValidAction(creep) && 
                priority[iAction].isAddableAction(creep) && 
                this.assignAction(creep, priority[iAction]))
                    return;
            }
	        
            // idle
            this.assignAction(creep, this.actions.idle);
	    }
	    
	    else {
	        
            // urgent upgrading 
            if( creep.room.ticksToDowngrade < 2000 ) {
                if( this.assignAction(creep, this.actions.upgrading) ) 
                    return;
            }
            
            var priority;
            if( creep.room.situation.invasion ) priority = [
                this.actions.feeding, 
                this.actions.fueling, 
                this.actions.repairing, 
                this.actions.building, 
                this.actions.storing, 
                this.actions.upgrading];
            else priority = [
                this.actions.pickup,
                this.actions.feeding, 
                this.actions.repairing, 
                this.actions.building, 
                this.actions.fueling, 
                this.actions.storing, 
                this.actions.upgrading];
            
            for(var iAction = 0; iAction < priority.length; iAction++) {
                
                if(priority[iAction].isValidAction(creep) && 
                priority[iAction].isAddableAction(creep) && 
                this.assignAction(creep, priority[iAction]))
                    return;
            }
            
            // idle
            this.assignAction(creep, this.actions.idle);
	    }
    }, 
    assignAction: function(creep, action){
        creep.action = action;
        creep.target = action.newTarget(creep);
        
        if( creep.target ) {
            creep.memory.action = action.name;
            creep.memory.target = action.getTargetId(creep.target);
            
            if(!creep.room.activities[action])
                creep.room.activities[action] = 1;
            else creep.room.activities[action]++;
            return true;
        }
        
        creep.action = null;
        creep.target = null;
        return false;
    }
};

module.exports = work;