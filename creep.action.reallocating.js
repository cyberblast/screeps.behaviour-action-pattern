let action = new Creep.Action('reallocating');
module.exports = action;
action.maxPerTarget = 1;
action.maxPerAction = 1;
action.isValidAction = function(creep){
    return creep.room.storage && creep.room.terminal &&
        ( this.isValidMineralToTerminal(creep) ||
        this.isValidEnergyToStorage(creep) ||
        this.isValidMineralToStorage(creep) );
};
action.isValidMineralToTerminal = function(creep){
    let room = creep.room;
    let storage = room.storage;
    let terminal = room.terminal;
    return ( storage.store[room.mineralType] &&
        (storage.store[creep.room.mineralType] + (creep.carry[room.mineralType] || 0)) > MAX_STORAGE_MINERAL*1.05 &&
        (terminal.sum - terminal.store.energy + Math.max(terminal.store.energy, TERMINAL_ENERGY)) < terminal.storeCapacity);
};
action.isValidEnergyToStorage = function(creep){
    return creep.room.terminal.store.energy + creep.carry.energy > TERMINAL_ENERGY * 1.05;
};
action.isValidMineralToStorage = function(creep){
    let terminal = creep.room.terminal;
    let mineral = terminal.store[creep.room.mineralType] || 0;
    return terminal.sum > mineral + terminal.store.energy;
};
action.isAddableAction = function(creep){
    let pop = creep.room.population;
    return creep.sum == 0 &&(!pop || !pop.actionCount[this.name] || pop.actionCount[this.name] < this.maxPerAction);
};
action.isValidTarget = function(target){
    return true;
};
action.isAddableTarget = function(target){
    return true;
};
action.newTarget = function(creep){
    let terminal = creep.room.terminal;
    if( (creep.sum == 0) == (terminal.store.energy > TERMINAL_ENERGY*1.05 || this.isValidMineralToStorage(creep)) ) return terminal;
    else return creep.room.storage;
};
action.work = function(creep){
    let target = creep.target;
    let room = creep.room;
    let storage = room.storage;
    let terminal = room.terminal;
    var workResult = null;
    if( creep.sum == 0 && target.structureType == STRUCTURE_STORAGE ){
        // load: storage => terminal
        workResult = creep.withdraw(target, room.mineralType);
        this.assign(creep, terminal);
        delete creep.data.path;
    } else if( creep.sum == 0 && target.structureType == STRUCTURE_TERMINAL ) {
        // load: terminal => storage
        if( this.isValidEnergyToStorage(creep) )
            workResult = creep.withdraw(target, RESOURCE_ENERGY);
        else if( this.isValidMineralToStorage(creep) ){
            // TODO: get minerals != room mineral
            let withdraw = r => {
                if( r != RESOURCE_ENERGY && r != room.mineralType && target.store[r] > 0 )
                    workResult = creep.withdraw(target, r);
            };
            _.forEach(Object.keys(target.store), withdraw);
        }
        this.assign(creep, storage);
        delete creep.data.path;
    } else if( target.structureType == STRUCTURE_TERMINAL ) {
        // deliver: storage => terminal
        workResult = creep.transfer(target, room.mineralType);
        // unregister action
        delete creep.data.actionName;
        delete creep.data.targetId;
        creep.action = null;
        creep.target = null;
        delete creep.data.path;
    } else if( target.structureType == STRUCTURE_STORAGE ) {
        // deliver: terminal => storage
        for(let resourceType in creep.carry) {
            if( creep.carry[resourceType] > 0 ){
                workResult = creep.transfer(target, resourceType);
                if( workResult != OK ) break;
            }
        }
        //workResult = creep.transfer(target, RESOURCE_ENERGY);
        // unregister action
        if( creep.sum == creep.carry.energy ){
            delete creep.data.actionName;
            delete creep.data.targetId;
            creep.action = null;
            creep.target = null;
            delete creep.data.path;
        }
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
