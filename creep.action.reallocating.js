var action = new Creep.Action('reallocating');
action.maxPerTarget = 4;
action.maxPerAction = 4;
action.isValidAction = function(creep){
    return creep.room.storage && creep.room.terminal && creep.room.storage.store[creep.room.mineralType] && creep.room.storage.store[creep.room.mineralType] > MAX_STORAGE_MINERAL*1.05;
};
action.isValidTarget = function(target){
    return true;
};
action.isAddableTarget = function(target){
    return true;
};
action.isAddableAction = function(creep){
    return _.sum(creep.carry) == 0;
};
action.newTarget = function(creep){
    if( _.sum(creep.carry) == 0) return creep.room.storage;
    else return creep.room.terminal; 
};
action.work = function(creep){
    var workResult = null;
    if( creep.target.structureType == STRUCTURE_STORAGE ){
        workResult = creep.withdraw(creep.target, creep.room.mineralType);
        this.assign(creep, creep.room.terminal);
    } else if( creep.target.structureType == STRUCTURE_TERMINAL ) {
        workResult = creep.transfer(creep.target, creep.room.mineralType);
        // unregister action
        creep.data.actionName = null;
        creep.data.targetId = null;
        creep.action = null;
        creep.target = null;
    } else {
        this.assign(creep, creep.room.terminal);
    }    
    return workResult;
};
action.onAssignment = function(creep, target) {
    if( SAY_ASSIGNMENT ) creep.say(String.fromCharCode(8660), SAY_PUBLIC); 
};
module.exports = action;