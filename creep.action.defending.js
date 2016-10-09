var action = new Creep.Action('defending');
action.isValidAction = function(creep){ return creep.room.situation.invasion; };
action.isAddableAction = function(){ return true; };
action.isAddableTarget = function(){ return true; };
action.isValidTarget = function(target){
    return (
        target &&
        target.hits != null && 
        target.hits > 0 &&
        target.my == false );
}; 
action.newTarget = function(creep){
    var closestHostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
        filter: function(hostile){ return _.some(hostile.body, {'type': HEAL}); } 
    });    
    if(!closestHostile) {
        closestHostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    }     
    return closestHostile;
};
action.step = function(creep){
    if(CHATTY) creep.say(this.name, SAY_PUBLIC);
    this.run[creep.data.creepType](creep);
};
action.run = {
    ranger: function(creep) {
        var range = creep.pos.getRangeTo(creep.target);
        if( range > 3 ){
            var path = creep.room.findPath(creep.pos, creep.target.pos, {ignoreCreeps: true});
            if( path && path.length > 0 ) {
                var isRampart = COMBAT_CREEPS_RESPECT_RAMPARTS && _.some( creep.room.lookForAt(LOOK_STRUCTURES, path[0].x, path[0].y), {'structureType': STRUCTURE_RAMPART });
                if(!isRampart){
                    creep.move(path[0].direction);
                }
            } else {
                // no path -> try to move by direction
                var direction = creep.pos.getDirectionTo(creep.target);
                creep.move(direction);
            }
        }
        if( range < 3 ){
            var direction = creep.target.pos.getDirectionTo(creep);
            creep.move(direction);
        }
        
        // attack
        var targets = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3);
        if(targets.length > 2) { // TODO: precalc damage dealt
            if(CHATTY) creep.say('MassAttack');
            creep.rangedMassAttack();
            return;
        }
        if( range < 4 ) {
            creep.rangedAttack(creep.target);
            return;
        }
        if(targets.length > 0){
            creep.rangedAttack(targets[0]);
        }
    }, 
    melee: function(creep) {
        var path = creep.room.findPath(creep.pos, creep.target.pos);
        // not standing in rampart or next step is rampart as well
        if( path.length > 0 && (
            !COMBAT_CREEPS_RESPECT_RAMPARTS ||
            !_.some( creep.room.lookForAt(LOOK_STRUCTURES, creep.pos.x, creep.pos.y), {'structureType': STRUCTURE_RAMPART } )  || 
            _.some( creep.room.lookForAt(LOOK_STRUCTURES, path[0].x, path[0].y), {'structureType': STRUCTURE_RAMPART }))
        ){
            creep.move(path[0].direction);
        }         
        // attack
        if( creep.attack(creep.target) == ERR_NOT_IN_RANGE ) {
            var targets = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 1);
            if( targets.length > 0)
                creep.attack(targets[0]);
        }
    }
};
action.onAssignment = function(creep, target) {
    if( SAY_ASSIGNMENT ) creep.say(String.fromCharCode(9876), SAY_PUBLIC); 
};
module.exports = action;
