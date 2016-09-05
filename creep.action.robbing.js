var action = new Creep.Action('robbing');
action.maxPerTarget = 2;
action.isAddableAction = function (target) {
    return true;
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
    let t = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {
        filter: function(o){
            return o.energy >=  (creep.carryCapacity - _.sum(creep.carry)); 
            // TODO: check for ANY resource
            // TODO: o.energy correct? may be o.store.energy
            // TODO: testing
        }
    });
    return t;
};
action.work = function(creep){
    return creep.withdraw(creep.target, RESOURCE_ENERGY);
};
module.exports = action;
