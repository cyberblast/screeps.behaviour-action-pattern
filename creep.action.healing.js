var action = new MODULES.creep.Action();

action.name = 'healing';

action.isValidTarget = function(target){
    return (
        target.hits != null && 
        target.hits < target.hitsMax &&
        target.my == true );
}; 
action.isAddableAction = function(){ return true; };
action.isAddableTarget = function(){ return true; };

action.newTarget = function(creep){
    var injured = creep.room.find(FIND_MY_CREEPS, {
        filter: function(c){ return c.hits < c.hitsMax } 
    });
    if(injured){
        return _.sortBy(injured, function(i){ return (i.hitsMax - i.hits) * -1; })[0];
    }
    
    var melees = creep.room.find(FIND_MY_CREEPS, {
        filter: function(c){ return c.memory.setup == "melee" } 
    });
    if(melees) return melees[0];
    
    var ranger = creep.room.find(FIND_MY_CREEPS, {
        filter: function(c){ return c.memory.setup == "ranger" } 
    });
    if(ranger) return ranger[0];
    
    var any = creep.room.find(FIND_MY_CREEPS);
    if(any) return any[0];
    
    return Game.flags['IdlePole'];
};

action.step = function(creep){
    if(CHATTY) creep.say(this.name);
    var path = creep.room.findPath(creep.pos, creep.target.pos);
    // not standing in rampart or next step is rampart as well
    if( !_.some( creep.room.lookForAt(LOOK_STRUCTURES, creep.pos.x, creep.pos.y), {'structureType': STRUCTURE_RAMPART } )  || 
        _.some( creep.room.lookForAt(LOOK_STRUCTURES, path[0].x, path[0].y), {'structureType': STRUCTURE_RAMPART })
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

module.exports = action;