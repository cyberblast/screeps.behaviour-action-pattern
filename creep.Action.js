// base class for every action
let Action = function(actionName){
    // action name
    this.name = actionName;
    // max allowed creeps per target
    this.maxPerTarget = Infinity;
    // max allowed creeps per action (and room)
    this.maxPerAction = Infinity;
    // range within which the action can be executed (e.g. upgrade controller = 3)
    this.targetRange = 1;
    // range until which the target has been reached. (e.g. can be less than targetRange)
    this.reachedRange = 1;
    // if true, will try to find new target if a target has become invalid
    // if false, an invalid target wil invalidate the action as well (causing to get a new action)
    this.renewTarget = true;
    // get unique identifier of any object (id or name)
    this.getTargetId = function(target){
        return target.id || target.name;
    };
    // get an object by its unique identifier (id or name)
    this.getTargetById = function(id){
        return Game.getObjectById(id) || Game.spawns[id] || Game.flags[id];
    };
    // determines, if an action is (still) valid. Gets validated each tick. 
    // check possible override in derived action
    this.isValidAction = function(creep){
        return true;
    };
    // determines, if a target is (still) valid. Gets validated each tick. 
    // check possible override in derived action
    this.isValidTarget = function(target, creep){
        return (target != null);
    };
    // determines, if an action is valid. Gets validated only once upon assignment. 
    // check possible override in derived action
    this.isAddableAction = function(creep){
        return (this.maxPerAction === Infinity || !creep.room.population || !creep.room.population.actionCount[this.name] || creep.room.population.actionCount[this.name] < this.maxPerAction);
    };
    // determines, if a target is valid. Gets validated only once upon assignment. 
    // check possible override in derived action
    this.isAddableTarget = function(target, creep){ // target is valid to be given to an additional creep
        return (!target.targetOf || this.maxPerTarget === Infinity || _.filter(target.targetOf, {'actionName': this.name}).length < this.maxPerTarget);
    };
    // find a new target for that action
    // needs implementation in derived action
    this.newTarget = function(creep){
        return null;
    };
    // order for the creep to execute each tick, when assigned to that action
    this.step = function(creep){
        if(CHATTY) creep.say(this.name, SAY_PUBLIC);
        let range = creep.pos.getRangeTo(creep.target);
        if( range <= this.targetRange ) {
            var workResult = this.work(creep);
            if( workResult != OK ) {
                const tryAction = creep.action;
                const tryTarget = creep.target;
                creep.action = null;
                creep.target = null;
                creep.handleError({errorCode: workResult, action: this, target: creep.target, range, creep});
                return;
            }
        }
        if( creep.target ) {
            range = creep.pos.getRangeTo(creep.target);
            creep.drive( creep.target.pos, this.reachedRange, this.targetRange, range );
        }
    };
    // order for the creep to execute when at target
    this.work = function(creep){
        return ERR_INVALID_ARGS;
    };
    // validate, if this action is still valid for a certain creep and target
    // returns the target (could be a ne one) if valid or null
    this.validateActionTarget = function(creep, target){
        if( this.isValidAction(creep) ){ // validate target or new
            if( !this.isValidTarget(target, creep)){
                if( this.renewTarget ){ // invalid. try to find a new one...
                    delete creep.data.path;
                    return this.newTarget(creep);
                }
            } else return target;
        }
        return null;
    };
    // assign the action to a creep
    // optionally predefine a fixed target
    this.assign = function(creep, target){
        if( target === undefined ) target = this.newTarget(creep);
        if( target != null ) {
            if( DEBUG && TRACE ) trace('Action', {creepName:creep.name, assign:this.name, target:!target || target.name || target.id, Action:'assign'});
            if( creep.action == null || creep.action.name != this.name || creep.target == null || creep.target.id != target.id || creep.target.name != target.name ) {
                Population.registerAction(creep, this, target);
                this.onAssignment(creep, target);
            }
            return true;
        }
        return false;
    };
    // assignment postprocessing
    // needs implementation in derived action
    this.onAssignment = (creep, target) => {};
    // empty default strategy
    this.defaultStrategy = {
        name: `default-${actionName}`
    };
    // strategy accessor
    this.selectStrategies = function() {
        return [this.defaultStrategy];
    };
};
module.exports = Action;
