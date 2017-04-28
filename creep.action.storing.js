let action = new Creep.Action('storing');
module.exports = action;
action.isValidAction = function(creep){
    return (
        creep.room.storage && creep.room.storage.isActive() &&
        creep.sum > 0 &&
        (
            creep.data.creepType != 'worker' ||
            (
                creep.sum > creep.carry.energy ||
                (
                    (
                        !creep.room.population ||
                        (
                            creep.room.population.actionCount.upgrading != null &&
                            creep.room.population.actionCount.upgrading >= 1
                        )
                    ) &&
                    creep.room.sourceEnergyAvailable > 0 && creep.room.storage.charge <= 1
                )
            )
        )
    );
};
action.isValidTarget = function(target){
    return ((target) && (target.store) && target.isActive() && target.sum < target.storeCapacity);
};
action.isAddableTarget = function(target, creep){
    return ( target.my &&
        (!target.targetOf || target.targetOf.length < this.maxPerTarget) && 
        target.sum + creep.carry[RESOURCE_ENERGY] < target.storeCapacity);
};
action.isValidMineralToTerminal = function(room){
    return ( room.storage.store[room.mineralType] &&
        room.storage.store[room.mineralType] > MAX_STORAGE_MINERAL*1.05 &&
        ((room.terminal.sum - room.terminal.store.energy) + Math.max(room.terminal.store.energy, TERMINAL_ENERGY)) < room.terminal.storeCapacity);
};
action.newTarget = function(creep){
    let roomMineralType = creep.room.mineralType;
    let sendMineralToTerminal = creep => (
        creep.carry[roomMineralType] &&
        creep.carry[roomMineralType] > 0 &&
        this.isValidMineralToTerminal(creep.room));
    let sendEnergyToTerminal = creep => (
        creep.carry.energy > 0 &&
        creep.room.storage.charge > 0.5 &&
        creep.room.terminal.store.energy < TERMINAL_ENERGY*0.95 &&
        creep.room.terminal.sum  < creep.room.terminal.storeCapacity);
        // &&
        //(creep.room.terminal.storeCapacity - creep.room.terminal.sum) >= creep.carry[roomMineralType]);

    if( creep.room.terminal && creep.room.terminal.isActive() &&
        ( sendMineralToTerminal(creep) || sendEnergyToTerminal(creep) ) &&
        this.isAddableTarget(creep.room.terminal, creep)) {
            return creep.room.terminal;
    }
    if( this.isValidTarget(creep.room.storage) && this.isAddableTarget(creep.room.storage, creep) )
        return creep.room.storage;
    return null;
};
action.work = function(creep){
    var workResult;
    for(var resourceType in creep.carry) {
        if( creep.carry[resourceType] > 0 ){
            workResult = creep.transfer(creep.target, resourceType);
            if( workResult != OK ) break;
        }
    }
    delete creep.data.actionName;
    delete creep.data.targetId;
    return workResult;
};