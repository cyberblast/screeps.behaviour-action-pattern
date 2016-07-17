var action = new MODULES.creep.Action();

action.name = 'invading';
action.reusePath = 0;

action.isValidAction = function(){ return true; };
action.isAddableAction = function(){ return true; };
action.isAddableTarget = function(){ return true; };

action.newTarget = function(creep){
    // if not in targetroom, target is flag
    var flag = _.find(Game.flags, {'color': FLAG_COLOR.destroy });
    if( flag && (!flag.room || flag.room.name != creep.room.name))
        return flag; // other room
        
    if( flag && flag.room ){
        var targets = flag.room.lookForAt(LOOK_STRUCTURES, flag.pos.x, flag.pos.y);
        if( targets && targets.length > 0)
            return targets[0];
    }
    
    flag = _.find(Game.flags, {'color': FLAG_COLOR.invade })
    if( flag && (!flag.room || flag.room.name != creep.room.name))
        return flag; // other room
    
    if( !flag ){
        return Game.flags['IdlePole'];
    }
    
    if( !flag.room.controller.my ) {
        var closestHostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
            filter: function(hostile){ return _.some(hostile.body, {'type': HEAL}); } 
        });
        if(!closestHostile) {
            closestHostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        } 
        if( closestHostile ) 
            return closestHostile;
        
        var target = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_SPAWN;
            }
        });
        if( target ) 
            return target;
            
        target = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType != STRUCTURE_CONTROLLER;
            }
        });
        if( target ) 
            return target;
            
        target = creep.pos.findClosestByPath(FIND_HOSTILE_CONSTRUCTION_SITES);
        if( target ) 
            return target;
    }
    
    return Game.flags['IdlePole'];
};

action.step = function(creep){
    if(CHATTY) creep.say(this.name);
    this.setup[creep.memory.setup](creep);
}

action.setup = {
    melee: function(creep){
        var target = creep.action.newTarget(creep);
        if( target ){
            if( creep.target && creep.target != target && creep.target.creeps && creep.target.creeps.includes(creep.name) )
                creep.target.creeps.splice(creep.target.creeps.indexOf(creep.name), 1);
            creep.target = target;        
            if( !creep.target.creeps ) 
                creep.target.creeps = [];
            if( !(creep.name in creep.target.creeps) ) 
                creep.target.creeps.push(creep.name);
            creep.memory.target = creep.action.getTargetId(creep.target);
        }
        
        if( creep.target.color ){
            creep.say('Approaching');
            creep.moveTo(creep.target, {reusePath: 15});
            return;
        }
        
        var moveResult = creep.moveTo(creep.target);
        if( !creep.target.my )
            var workResult = creep.attack(creep.target);
    }
};

module.exports = action;