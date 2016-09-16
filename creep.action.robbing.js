var action = new Creep.Action('robbing');
action.maxPerTarget = 2;
action.isAddableAction = function (target) {
    return !target.my;
}
action.isValidAction = function(creep){
    return (_.sum(creep.carry) < creep.carryCapacity &&
    FlagDir.find(FLAG_COLOR.invade.robbing, creep.pos) != null
        // && (creep.room.energyAvailable < creep.room.energyCapacityAvailable || creep.room.towerFreeCapacity > 500 )
    );
};
action.isValidTarget = function(target){
    return ( (target != null)  );
};  
action.newTarget = function(creep){
    let target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: function(structure){
            return structure.store && !structure.my &&  _.sum(structure.store) > 0; 
        }
    });
    return target;
};
action.work = function(creep){    
    for( var type in creep.target.store ){
        if( creep.target.store[type] > 0 )
            return creep.withdraw(creep.target, type);
    }
    return ERR_NOT_ENOUGH_RESOURCES;
};
module.exports = action;
