var action = new MODULES.creep.Action();

action.name = 'healing';
action.reusePath = 0;

action.isValidTarget = function(target){
    return true;
    /*
    return (
        target.hits != null && 
        //target.hits < target.hitsMax &&
        target.my == true );*/
}; 
action.isAddableAction = function(){ return true; };
action.isAddableTarget = function(){ return true; };

action.newTarget = function(creep){
    var injured = creep.room.find(FIND_MY_CREEPS, {
        filter: function(c){ return c.hits < c.hitsMax } 
    });
    if(injured && injured.length > 0){
        return _.sortBy(injured, function(i){ return i.hits - i.hitsMax; })[0];
    }
    
    // TODO: Follow to other rooms (new action?)
    var melees = creep.room.find(FIND_MY_CREEPS, { // follow
        filter: function(c){ return c.memory.setup == "melee" } 
    });
    if(melees) return melees[0];
    
    var ranger = creep.room.find(FIND_MY_CREEPS, {
        filter: function(c){ return c.memory.setup == "ranger" } 
    });
    if(ranger) return ranger[0];
    
    var any = creep.room.find(FIND_MY_CREEPS);
    if(any) return any[0];
    
    return this.defaultAction(creep);
};

action.work = function(creep){
    if( creep.target.hits < creep.target.hitsMax ){
        if( creep.pos.isNearTo(creep.target) ){
            return creep.heal(creep.target);
        }
        if(creep.pos.inRangeTo(creep.target, 3)) {
            return creep.rangedHeal(target);
        }
        return OK;
    }
};

module.exports = action;