var Action = function(actionName){
    this.name = actionName;
    this.reusePath = 5;
    this.maxPerTarget = 1;
    this.renewTarget = true;
    this.getTargetId = function(target){ 
        return target.id || target.name;
    };
    this.getTargetById = function(id){
        return Game.getObjectById(id) || Game.spawns[id] || Game.flags[id];
    };
    this.isValidAction = function(creep){
        return true;
    };
    this.isValidTarget = function(target){
        return (target != null);
    };
    this.newTarget = function(creep){
        return null;
    };
    this.isAddableAction = function(creep){
        return (!creep.room.population.actionCount[this.name] || creep.room.population.actionCount[this.name] < creep.room.maxPerJob);
    };
    this.isAddableTarget = function(target){ // target is valid to be given to an additional creep
        return (this.maxPerTarget > 0 && (!target.targetOf || target.targetOf.length < this.maxPerTarget));
    };
    this.step = function(creep){     
        if(CHATTY) creep.say(this.name, SAY_PUBLIC);
        var moveResult = creep.moveTo(creep.target, {reusePath: this.reusePath});
        var workResult = this.work(creep);
        if( ![OK, ERR_NOT_IN_RANGE].includes(workResult) ) {
            if( DEBUG ) ERROR_LOG(creep, workResult);
            creep.action = null;
        }
        if( workResult != OK && moveResult == ERR_NO_PATH ){// get out of the way
            Creep.action.idle.step(creep);
            return;
        } 
        if( ![OK, ERR_TIRED, ERR_NO_PATH].includes(moveResult) ) {
            if( DEBUG ) ERROR_LOG(creep, moveResult);
            creep.action = null;
        }
    };    
    this.work = function(creep){
        return ERR_INVALID_ARGS;
    };
    this.validateActionTarget = function(creep, target){
        if( this.isValidAction(creep) ){ // validate target or new
            if( !this.isValidTarget(target) || 
                (this.maxTargetLease && 
                (Game.time-this.memory.targetAssignmentTime) > this.maxTargetLease )){ 
                if( this.renewTarget ){ // invalid. try to find a new one...
                    return this.newTarget(creep);
                }
            } else return target;
        } 
        return null;
    };
    this.assign = function(creep, target){      
        if( target === undefined ) target = this.newTarget(creep);
        if( target != null ) {
            Population.registerAction(creep, this, target);
            return true;
        }
        return false;
    }
}
module.exports = Action;