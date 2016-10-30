var action = new Creep.Action('reallocating');
action.maxPerTarget = 4;
action.maxPerAction = 4;
action.isValidAction = function(creep){
    return creep.room.storage && creep.room.terminal && creep.room.storage.store[creep.room.mineralType] && 
        (creep.room.terminal.store.energy > TERMINAL_ENERGY*1.05 || 
        ((creep.room.terminal.sum - creep.room.terminal.energy + Math.max(creep.room.terminal.energy, TERMINAL_ENERGY)) < creep.room.terminal.storeCapacity &&
        creep.room.storage.store[creep.room.mineralType] > MAX_STORAGE_MINERAL*1.05));
};
action.isValidTarget = function(target){
    return true;
};
action.isAddableTarget = function(target){
    return true;
};
action.isAddableAction = function(creep){
    return creep.sum == 0;
};
action.newTarget = function(creep){
    if( (creep.sum == 0) == (creep.room.terminal.store.energy > TERMINAL_ENERGY*1.05) ) return creep.room.terminal;
    else return creep.room.storage; 
};
action.work = function(creep){
    var workResult = null;
    if( creep.sum == 0 && creep.target.structureType == STRUCTURE_STORAGE ){
        workResult = creep.withdraw(creep.target, creep.room.mineralType);
        this.assign(creep, creep.room.terminal);    
        delete creep.data.path;
    } else if( creep.sum == 0 && creep.target.structureType == STRUCTURE_TERMINAL ) {
        workResult = creep.withdraw(creep.target, RESOURCE_ENERGY);
        this.assign(creep, creep.room.storage);    
        delete creep.data.path;
    } else if( creep.target.structureType == STRUCTURE_TERMINAL ) {
        workResult = creep.transfer(creep.target, creep.room.mineralType);
        // unregister action
        delete creep.data.actionName;
        delete creep.data.targetId;
        creep.action = null;
        creep.target = null;    
        delete creep.data.path;
    } else if( creep.target.structureType == STRUCTURE_STORAGE ) {
        workResult = creep.transfer(creep.target, RESOURCE_ENERGY);
        // unregister action
        delete creep.data.actionName;
        delete creep.data.targetId;
        creep.action = null;
        creep.target = null;    
        delete creep.data.path;
    } else {
        delete creep.data.actionName;
        delete creep.data.targetId;
        creep.action = null;
        creep.target = null;    
        delete creep.data.path;
    }    
    return workResult;
};
action.onAssignment = function(creep, target) {
    if( SAY_ASSIGNMENT ) creep.say(String.fromCharCode(8660), SAY_PUBLIC); 
};
module.exports = action;