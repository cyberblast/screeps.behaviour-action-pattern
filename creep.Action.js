var Action = function(actionName){
    this.name = actionName;
    this.reusePath = 5;
    this.ignoreCreeps = false;
    this.maxPerTarget = 1;
    this.maxPerTargetType = 'worker'; // TODO: if null take sum
    this.maxTargetLease = null; // ticks until target refind
    this.renewTarget = true;
    this.defaultTarget = function(creep){
        var flags = _.sortBy(creep.room.find(FIND_FLAGS, { filter: FLAG_COLOR.idle.filter }), 
            function(o) { 
                return (o.creeps ? o.creeps.length : 0); 
            }
        );
        if( flags ) return flags[0];
        if( creep.memory.home && creep.room.name != creep.memory.home){
            // go to home room
            var exitDir = creep.room.findExitTo(creep.memory.home);
            var exit = creep.pos.findClosestByRange(exitDir);
            return exit;
        }
        return creep.room.controller;
    };
    this.defaultAction = function(creep){
        creep.moveTo(this.defaultTarget(creep), {reusePath: this.reusePath, ignoreCreeps: this.ignoreCreeps});
    };
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
        return (!creep.room.activities[this.name] || creep.room.activities[this.name] < creep.room.maxPerJob);
    };
    this.isAddableTarget = function(target){ // target is valid to be given to an additional creep
        return (this.maxPerTarget > 0 && (!target.creeps || !target.creeps[this.maxPerTargetType] || target.creeps[this.maxPerTargetType].length < this.maxPerTarget));
    };
    this.step = function(creep){     
        if(CHATTY) creep.say(this.name, SAY_PUBLIC);
        var moveResult = creep.moveTo(creep.target, {reusePath: this.reusePath, ignoreCreeps: this.ignoreCreeps});
        var workResult = this.work(creep);
        if( ![OK, ERR_NOT_IN_RANGE].includes(workResult) ) {
            if( DEBUG ) ERROR_LOG(creep, workResult);
            creep.memory.action = null;
            creep.memory.target = null;
        }
        if( workResult != OK && moveResult == ERR_NO_PATH ){// get out of the way
            this.defaultAction(creep);
            return;
        } 
        if( ![OK, ERR_TIRED, ERR_NO_PATH].includes(moveResult) ) {
            if( DEBUG ) ERROR_LOG(creep, moveResult);
            creep.memory.action = null;
            creep.memory.target = null;
        }
    };    
    this.work = function(creep){
        return ERR_INVALID_ARGS;
    };
}    
module.exports = Action;