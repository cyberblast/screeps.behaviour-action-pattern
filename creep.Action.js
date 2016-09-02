var Action = function(actionName){
    this.name = actionName;
    this.maxPerTarget = 1;
    this.targetRange = 1;
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
        return (!creep.room.population.actionCount[this.name] || creep.room.population.actionCount[this.name] < creep.room.maxPerJob);
    };
    this.isAddableTarget = function(target){ // target is valid to be given to an additional creep
        return (this.maxPerTarget > 0 && (!target.targetOf || target.targetOf.length < this.maxPerTarget));
    };
    this.newTarget = function(creep){
        return null;
    };
    this.step = function(creep){     
        if(CHATTY) creep.say(this.name, SAY_PUBLIC);
        let range = creep.pos.getRangeTo(creep.target);
        //var moveResult = creep.moveTo(creep.target, {reusePath: this.reusePath});
        if( range <= this.targetRange ) {
            var workResult = this.work(creep);
            if( workResult != OK ) {
                if( DEBUG ) logErrorCode(creep, workResult);
                creep.data.actionName = null;
            }
        } 
        if( range > 1 )
            this.drive(creep, creep.target.pos, range);
        /*
        if( workResult != OK && moveResult == ERR_NO_PATH ){// get out of the way
            Creep.action.idle.step(creep);
            return;
        } 
        if( ![OK, ERR_TIRED, ERR_NO_PATH].includes(moveResult) ) {
            if( DEBUG ) logErrorCode(creep, moveResult);
            creep.data.actionName = null;
        }
        */
    };
    this.work = function(creep){
        return ERR_INVALID_ARGS;
    };
    this.drive = function(creep, targetPos, rangeToTarget) {
        if( creep.fatigue > 0 ) {
            return;
        }
        let lastPos = creep.data.lastPos;
        creep.data.lastPos = new RoomPosition(creep.pos.x, creep.pos.y, creep.pos.roomName);
        if( creep.data.moveMode == null || 
            (lastPos && (lastPos.x != creep.pos.x || lastPos.y != creep.pos.y || lastPos.roomName != creep.pos.roomName)) ) {
            if( creep.data.path && creep.data.path.length > 1 )
                creep.data.path.shift();
            else creep.data.path = this.getPath(creep, targetPos, true);
            if( creep.data.path && creep.data.path.length > 0 ) {
                let moveResult = creep.move(creep.data.path[0].direction);
                if( moveResult == OK ) {
                    creep.data.moveMode = 'auto'; 
                } else logErrorCode(creep, moveResult);
            } else creep.say('NO PATH!');
        } else if( rangeToTarget > this.targetRange ) {
            if( HONK ) creep.say('HONK', SAY_PUBLIC);
            if( creep.data.moveMode == 'auto' ) {
                // try again to use path.     
                if( creep.data.path && creep.data.path.length > 1 )
                    creep.data.path.shift();
                else creep.data.path = this.getPath(creep, targetPos, true);
                if( creep.data.path && creep.data.path.length > 0 ) {
                    let moveResult = creep.move(creep.data.path[0].direction);
                    if( moveResult != OK ) logErrorCode(creep, moveResult);
                } else creep.say('NO PATH!');
                creep.data.moveMode = 'single';
            } else {
                // get path (don't ignore creeps)
                // try to move. 
                delete creep.data.path;
                creep.data.path = this.getPath(creep, targetPos, false);
                if( creep.data.path && creep.data.path.length > 0 ) {
                    if( creep.data.path.length > 5 ) creep.data.path = creep.data.path.slice(0,4);
                    let moveResult = creep.move(creep.data.path[0].direction);
                    if( moveResult != OK ) logErrorCode(creep, moveResult);
                } else creep.say('NO PATH!');
            }
        }
    };
    this.getPath = function(creep, target, ignoreCreeps) {
        return creep.room.findPath(creep.pos, target, {
            serialize: false, 
            ignoreCreeps: ignoreCreeps
        })
    };
    this.validateActionTarget = function(creep, target){
        if( this.isValidAction(creep) ){ // validate target or new
            if( !this.isValidTarget(target)){ 
                if( this.renewTarget ){ // invalid. try to find a new one...
                    creep.data.moveMode = null;
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
            Population.registerAction(creep, this, target);
            creep.data.moveMode = null;
            delete creep.data.path;
            return true;
        }
        return false;
    }
}
module.exports = Action;