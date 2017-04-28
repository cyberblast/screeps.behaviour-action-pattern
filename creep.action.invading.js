let action = new Creep.Action('invading');
module.exports = action;
action.isValidAction = function(creep){ return FlagDir.hasInvasionFlag(); };
action.isAddableAction = function(){ return true; };
action.isAddableTarget = function(){ return true; };
action.getFlaggedStructure = function(flagColor, pos){
    let flagsEntries = FlagDir.filter(flagColor, pos, true);
    let target = [];
    let checkFlag = flagEntry => {
        var flag = Game.flags[flagEntry.name];
        if( flag && flag.pos.roomName == pos.roomName && flag.room !== undefined ){ // room is visible
            var targets = flag.room.lookForAt(LOOK_STRUCTURES, flag.pos.x, flag.pos.y);
            if( targets && targets.length > 0){
                addTarget = structure => {
                    structure.destroyFlag = flag;
                    target.push(structure);
                };
                targets.forEach(addTarget);
            }
            else { // remove flag. try next flag
                flag.remove();
            }
        }
    };
    flagsEntries.forEach(checkFlag);
    if( target && target.length > 0 ) return pos.findClosestByRange(target);
    return null;
};
action.newTarget = function(creep){
    var destroy = this.getFlaggedStructure(FLAG_COLOR.destroy, creep.pos);
    if( destroy ) {
        if( destroy.destroyFlag ) Population.registerCreepFlag(creep, destroy.destroyFlag);
        return destroy;
    }
    // move to invasion room
    var flag = FlagDir.find(FLAG_COLOR.invade, creep.pos, false);
    if( flag && (!flag.room || flag.pos.roomName != creep.pos.roomName)){
        Population.registerCreepFlag(creep, flag);
        return flag; // other room
    }
    if( !flag ){
        // unregister
        creep.action = null;
        delete creep.data.actionName;
        delete creep.data.targetId;
        return;
    }

    if( !flag.room.controller || !flag.room.controller.my ) {
        //attack healer
        var target = creep.pos.findClosestByRange(creep.room.hostiles, {
            function(hostile){ return _.some(hostile.body, {'type': HEAL}); }
        });
        if( target )
            return target;
        //attack attacker
        target = creep.pos.findClosestByRange(creep.room.hostiles, {
            function(hostile){ return _.some(hostile.body, function(part){return part.type == ATTACK || part.type == RANGED_ATTACK;}); }
        });
        if( target )
            return target;

        // attack tower
       target = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_TOWER;
            }
        });
        if( target )
            return target;
        // attack remaining creeps
        target = creep.pos.findClosestByRange(creep.room.hostiles);
        if( target )
            return target;
        // attack spawn
        target = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_SPAWN;
            }
        });
        if( target )
            return target;
        // attack structures
        target = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {
            filter : (structure) => {
                return structure.structureType != STRUCTURE_CONTROLLER;
            }
        });
        if( target )
            return target;
        // attack construction sites
        target = creep.pos.findClosestByPath(FIND_HOSTILE_CONSTRUCTION_SITES);
        if( target )
            return target;
    }
    // no target found
    flag.remove();
    return null;
};
action.step = function(creep){
    if(global.CHATTY) creep.say(this.name);
    if( (creep.target instanceof Flag) && (creep.target.pos.roomName == creep.pos.roomName))
        this.assign(creep);
    this.run[creep.data.creepType](creep);
};
action.run = {
    melee: function(creep){
        if( !creep.flee ){
            if( creep.target instanceof Flag ){
                creep.travelTo( creep.target );
                return;
            } else if( creep.target instanceof ConstructionSite ){
                creep.travelTo( creep.target, {range:0});
                return;
            }
            creep.travelTo( creep.target );
        }
        if( !creep.target.my )
            creep.attacking = creep.attack(creep.target) == OK;
    },
    ranger: function(creep){
        var range = creep.pos.getRangeTo(creep.target);
        if( !creep.flee ){
            if( creep.target instanceof Flag ){
                creep.travelTo( creep.target );
                return;
            } else if( creep.target instanceof ConstructionSite ){
                creep.travelTo( creep.target, {range:0});
                return;
            }
            if( range > 3 ){
                creep.travelTo( creep.target );
            }
            if( range < 3 ){
                creep.move(creep.target.pos.getDirectionTo(creep));
            }
        }
        // attack
        var targets = creep.pos.findInRange(creep.room.hostiles, 3);
        if(targets.length > 2) { // TODO: calc damage dealt
            if(global.CHATTY) creep.say('MassAttack');
            creep.attackingRanged = creep.rangedMassAttack() == OK;
            return;
        }
        if( range < 4 ) {
            creep.attackingRanged = creep.rangedAttack(creep.target) == OK;
            return;
        }
        if(targets.length > 0){
            creep.attackingRanged = creep.rangedAttack(targets[0]) == OK;
        }
    }
};
action.defaultStrategy.moveOptions = function(options) {
    // allow routing in and through hostile rooms
    if (_.isUndefined(options.allowHostile)) options.allowHostile = true;
    return options;
};