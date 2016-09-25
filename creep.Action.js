var Action = function(actionName){
    this.name = actionName;
    this.maxPerTarget = 1;
    this.maxPerAction = 1;
    this.targetRange = 1;
    this.reachedRange = 1;
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
    this.isAddableAction = function(creep){
        return (!creep.room.population || !creep.room.population.actionCount[this.name] || creep.room.population.actionCount[this.name] < this.maxPerAction);
    };
    this.isAddableTarget = function(target){ // target is valid to be given to an additional creep
        return (!target.targetOf || target.targetOf.length < this.maxPerTarget);
    };
    this.newTarget = function(creep){
        return null;
    };
    this.step = function(creep){
        if(CHATTY) creep.say(this.name, SAY_PUBLIC);
        let range = creep.pos.getRangeTo(creep.target);
        if( range <= this.targetRange ) {
            var workResult = this.work(creep);
            if( workResult != OK ) {
                if( DEBUG ) logErrorCode(creep, workResult);
                creep.data.actionName = null;
            }
        } 
        creep.drive( creep.target.pos, this.reachedRange, this.targetRange, range );
    };
    this.work = function(creep){
        return ERR_INVALID_ARGS;
    };
    this.validateActionTarget = function(creep, target){
        if( this.isValidAction(creep) ){ // validate target or new
            if( !this.isValidTarget(target)){ 
                if( this.renewTarget ){ // invalid. try to find a new one...
                    delete creep.data.path;
                    return this.newTarget(creep);
                }
            } else return target;
        } 
        return null;
    };
    this.assign = function(creep, target){
        if( target === undefined ) target = this.newTarget(creep);
        if( target != null ) {
            if( creep.action == null || creep.action.name != this.name || creep.target == null || creep.target.id != target.id ) {
                Population.registerAction(creep, this, target);
                this.onAssignment(creep, target);
            }
            return true;
        }
        return false;
    };
    this.onAssignment = function(creep, target) {
    };
}
module.exports = Action;
