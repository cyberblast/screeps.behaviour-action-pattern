var work = {
    actions: {
        //harvesting: require('creep.action.harvesting'), 
        //upgrading: require('creep.action.upgrading'), 
        //building: require('creep.action.building'), 
        storing: require('creep.action.storing'), 
        repairing: require('creep.action.repairing'),
        feeding: require('creep.action.feeding'),
        fueling: require('creep.action.fueling'),
        idle: require('creep.action.idle'),
        pickup: require('creep.action.pickup'),
        withdrawing: require('creep.action.withdrawing')
    },
    run: function(creep) {
        if( !creep.room.storage || creep.room.storage.energy == 0 ){
            this.assignAction(creep, this.actions.idle);
            creep.action.step(creep);
            return;
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
                    if( creep.memory.action ) creep.room.activities[creep.memory.action]--;
                    creep.memory.action = null;
                    creep.memory.target = null;
                    creep.action = null;
                    creep.target = null;
                }
            } else {
	            if( creep.memory.action ) creep.room.activities[creep.memory.action]--;
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
                
            if( creep.carry.energy == 0 && creep.memory.action != 'pickup') {
                var moveResult = creep.moveTo(creep.room.storage);
                var workResult = creep.withdraw(creep.room.storage, RESOURCE_ENERGY);
                if(workResult == OK || moveResult == OK)
                    return;
                
                if( moveResult == ERR_NO_PATH && Game.flags['IdlePole']){// get out of the way
                    creep.moveTo(Game.flags['IdlePole']);
                    return;
                } 
                if( !(moveResult in [ERR_TIRED, ERR_NO_PATH]) ) {
                    if( DEBUG ) logError(creep, result);
                }
            } else {
                creep.action.step(creep);
            }
        } 
    }, 
    nextAction: function(creep){
        creep.memory.target = null;
        creep.target = null;

        var priority;
        if( creep.room.situation.invasion ) 
            priority = [
                this.actions.storing,
                this.actions.feeding, 
                this.actions.fueling, 
                this.actions.repairing];
        else            
            priority = [
                this.actions.storing,
                this.actions.pickup,
                this.actions.feeding, 
                this.actions.repairing];
        
        for(var iAction = 0; iAction < priority.length; iAction++) {
            
            if(priority[iAction].isValidAction(creep) && 
            priority[iAction].isAddableAction(creep) && 
            this.assignAction(creep, priority[iAction]))
                return;
        }
        
        // idle
        this.assignAction(creep, this.actions.idle);
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