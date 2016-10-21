var action = new Creep.Action('invading');
action.isValidAction = function(creep){ return FlagDir.hasInvasionFlag(); };
action.isAddableAction = function(){ return true; };
action.isAddableTarget = function(){ return true; };
action.getFlaggedStructure = function(flagColor, pos){
    let flagsEntries = FlagDir.filter(flagColor, pos, true);
    let target = [];
    let checkFlag = flagEntry => {
        var flag = Game.flags[flagEntry.name];
        if( flag && flag.room !== undefined ){ // room is visible
            var targets = flag.room.lookForAt(LOOK_STRUCTURES, flag.pos.x, flag.pos.y);
            if( targets && targets.length > 0)
                target = target.concat(targets);
            else { // remove flag. try next flag
                flag.remove();
            }
        }
    }
    flagsEntries.forEach(checkFlag);
    if( target && target.length > 0 ) return pos.findClosestByRange(target);
    return null;
}
action.newTarget = function(creep){
    var destroyFlag = this.getFlaggedStructure(FLAG_COLOR.destroy, creep.pos);
    if( destroyFlag ) {
        if( destroyFlag.color ) Population.registerCreepFlag(creep, destroyFlag);
        return destroyFlag;
    }
    // move to invasion room
    var flag = FlagDir.find(FLAG_COLOR.invade, creep.pos);
    if( flag && (!flag.room || flag.pos.roomName != creep.pos.roomName)){
        Population.registerCreepFlag(creep, flag);
        return flag; // other room    
    }
    if( !flag ){
        // unregister 
        creep.action = null;
        creep.data.actionName = null;
        return;
    }
    if( !flag.room.controller || !flag.room.controller.my ) {        
        //attack healer
        var target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
            filter: function(hostile){ return _.some(hostile.body, {'type': HEAL}); } 
        });
        if( target ) 
            return target;
        //attack attacker
        target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
            filter: function(hostile){ return _.some(hostile.body, function(part){return part.type == ATTACK || part.type == RANGED_ATTACK}); } 
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
        target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
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
            filter: (structure) => {
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
    if(CHATTY) creep.say(this.name);
    if( (creep.target instanceof Flag) && (creep.target.pos.roomName == creep.pos.roomName))
        this.assign(creep);
    this.run[creep.data.creepType](creep);
    if( creep.flee ) {
        let home = Game.spawns[creep.data.motherSpawn];
        creep.drive( home.pos, 1, 1, Infinity);
    }
}
action.run = {
    melee: function(creep){
        if( !creep.flee ){
            if( creep.target instanceof Flag ){
                creep.drive( creep.target.pos, 1, 1, Infinity);
                return;
            }        
            creep.moveTo(creep.target, {reusePath: 0});
        }
        if( !creep.target.my )
            creep.attacking = creep.attack(creep.target) == OK;
    }, 
    ranger: function(creep){ 
        if( !creep.flee ){    
            if( creep.target instanceof Flag){
                creep.drive( creep.target.pos, 1, 1, Infinity);
                return;
            }
            var range = creep.pos.getRangeTo(creep.target);
            if( range > 3 ){
                creep.moveTo(creep.target, {reusePath: 0});
            }
            if( range < 3 ){
                creep.move(creep.target.pos.getDirectionTo(creep));
            }
        }
        // attack
        var targets = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3);
        if(targets.length > 2) { // TODO: calc damage dealt
            if(CHATTY) creep.say('MassAttack');
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
    }, 
    warrior: function(creep){
        if( !creep.flee ){
            if( creep.target instanceof Flag ){
                creep.drive( creep.target.pos, 1, 1, Infinity);
                return;
            }
            let path = creep.room.findPath(creep.pos, creep.target.pos);
            if( path && path.length > 0 ) creep.move(path[0].direction);
        }
        // attack
        let attacking = creep.attack(creep.target);        
        if( attacking == ERR_NOT_IN_RANGE ) {
            let targets = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 1);
            if( targets.length > 0)
                creep.attacking = creep.attack(targets[0]) == OK;
        } else creep.attacking = attacking == OK;
        // attack ranged
        let targets = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3);
        if(targets.length > 2) { // TODO: precalc damage dealt
            if(CHATTY) creep.say('MassAttack');
            creep.attackingRanged = creep.rangedMassAttack() == OK;
            return;
        }
        let range = creep.pos.getRangeTo(creep.target);
        if( range < 4 ) {
            creep.attackingRanged = creep.rangedAttack(creep.target) == OK;
            return;
        }
        if(targets.length > 0){
            creep.attackingRanged = creep.rangedAttack(targets[0]) == OK;
        }
    }
};
action.onAssignment = function(creep, target) {
    if( SAY_ASSIGNMENT ) creep.say(String.fromCharCode(9876), SAY_PUBLIC); 
};
module.exports = action;