var Action = function(actionName){
    this.name = actionName;
    this.maxPerTarget = 1;
    this.maxPerAction = 1;
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
        if( range > 1 )
            this.drive(creep, creep.target.pos, range);
    };
    this.work = function(creep){
        return ERR_INVALID_ARGS;
    };
    this.drive = function(creep, targetPos, rangeToTarget) {
        // temporary deletion of old path storage as array
        if( creep.data.path && typeof creep.data.path !== 'string' )
            creep.data.path = null;

        if( creep.fatigue > 0 ) {
            return;
        }
        let lastPos = creep.data.lastPos;
        creep.data.lastPos = new RoomPosition(creep.pos.x, creep.pos.y, creep.pos.roomName);
        if( creep.data.moveMode == null || 
            (lastPos && // moved
            (lastPos.x != creep.pos.x || lastPos.y != creep.pos.y || lastPos.roomName != creep.pos.roomName)) 
        ) {
            // at this point its sure, that the creep DID move in the last loop. 
            // from lastPos to creep.pos 
            creep.room.recordMove(creep);

            if( creep.data.moveMode == null) 
                creep.data.moveMode = 'auto';
            if( creep.data.path && creep.data.path.length > 1 )
                creep.data.path = creep.data.path.substr(1);
            else 
                creep.data.path = this.getPath(creep, targetPos, true);
            if( creep.data.path && creep.data.path.length > 0 ) {
                let moveResult = creep.move(creep.data.path.charAt(0));
                if( moveResult == OK ) { // OK is no guarantee that it will move to the next pos. 
                    creep.data.moveMode = 'auto'; 
                } else logErrorCode(creep, moveResult);
            } else creep.say('NO PATH!');
        } else if( creep.data.moveMode == 'auto' ) {
            // try again to use path.
            if( rangeToTarget > this.targetRange ) {
                if( HONK ) creep.say('HONK', SAY_PUBLIC);
                creep.data.moveMode = 'evade';
            }
            if( !creep.data.path || creep.data.path.length == 0 )
                creep.data.path = this.getPath(creep, targetPos, true);
            if( creep.data.path && creep.data.path.length > 0 ) {
                let moveResult = creep.move(creep.data.path.charAt(0));
                if( moveResult != OK ) logErrorCode(creep, moveResult);
            } else creep.say('NO PATH!');
        } else { // evade
            // get path (don't ignore creeps)
            // try to move. 
            if( HONK ) creep.say('HONK', SAY_PUBLIC);
            delete creep.data.path;
            creep.data.path = this.getPath(creep, targetPos, false);
            if( creep.data.path && creep.data.path.length > 0 ) {
                if( creep.data.path.length > 5 ) 
                    creep.data.path = creep.data.path.substr(0,4);
                let moveResult = creep.move(creep.data.path.charAt(0));
                if( moveResult != OK ) logErrorCode(creep, moveResult);
            } else creep.say('NO PATH!');
        }
    };
    this.getPath = function(creep, target, ignoreCreeps) {

        //defrent rooms? choose best routce main, marked or highways
        if (creep.pos.roomName != target.roomName) {

            var route = Game.map.findRoute(creep.room, target.roomName, {
                routeCallback(roomName) {
                    let parsed = /^[WE]([0-9]+)[NS]([0-9]+)$/.exec(roomName);
                    let isHighway = (parsed[1] % 10 === 0) || (parsed[2] % 10 === 0);
                    let isMyRoom = Game.rooms[roomName] &&
                        Game.rooms[roomName].controller &&
                        Game.rooms[roomName].controller.my;
                    let isPrivateerRoom = FlagDir.find(FLAG_COLOR.invade.exploit, new RoomPosition(25, 28, roomName), true);
                    if (isHighway || isMyRoom || isPrivateerRoom) {
                        return 1;
                    } else {
                        return 30;
                    }
                }
            });
            if (route.length >0 )
                target = new RoomPosition(25,25,route[0].room);
        }

        let path = creep.room.findPath(creep.pos, target, {
            serialize: true, 
            ignoreCreeps: ignoreCreeps
        });
        if( path && path.length > 4 ) 
            return path.substr(4);
        else return null;
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
            return true;
        }
        return false;
    }
}
module.exports = Action;
