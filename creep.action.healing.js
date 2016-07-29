var action = new Creep.Action('healing');

action.reusePath = 0;

action.isValidTarget = function(target){
    return ( target != null &&
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
    if(injured && injured.length > 0){
        return _.sortBy(injured, function(i){ return i.hits - i.hitsMax; })[0];
    }
    return null;
};

action.work = function(creep){
    if( creep.target.hits < creep.target.hitsMax ){
        if( creep.pos.isNearTo(creep.target) ){
            return creep.heal(creep.target);
        }
        if(creep.pos.inRangeTo(creep.target, 3)) {
            return creep.rangedHeal(creep.target);
        }
        return OK;
    }
};

module.exports = action;