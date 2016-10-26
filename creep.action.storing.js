var action = new Creep.Action('storing');
action.maxPerTarget = 4;
action.maxPerAction = 4;
action.isValidAction = function(creep){
    return ( 
        creep.room.storage != null && 
        _.sum(creep.carry) > 0 && 
        (
            creep.data.creepType == 'hauler' || 
            creep.data.creepType == 'privateer' ||
            ( 
                _.sum(creep.carry) > creep.carry.energy || 
                (
                    (
                        !creep.room.population || 
                        (
                            creep.room.population.actionCount.upgrading != null && 
                            creep.room.population.actionCount.upgrading >= 1
                        )
                    ) &&
                    creep.room.sourceEnergyAvailable > 0 && 
                    creep.room.storage.store.energy <= MAX_STORAGE_ENERGY
                )
            )
        )
    );
};
action.isValidTarget = function(target){
    return ((target != null) && (target.store != null) && target.sum < target.storeCapacity);
};
action.isAddableTarget = function(target){
    return ( target.my && 
        (!target.targetOf || target.targetOf.length < this.maxPerTarget));
};
action.newTarget = function(creep){
    let roomMineralType = creep.room.mineralType;
    let sendMineralToTerminal = creep => (
        creep.carry[roomMineralType] &&    
        creep.carry[roomMineralType] > 0 &&     
        creep.room.storage.store[roomMineralType] && 
        creep.room.storage.store[roomMineralType] > MAX_STORAGE_MINERAL && 
        (creep.room.terminal.storeCapacity - creep.room.terminal.sum - Math.max(creep.room.terminal.energy, TERMINAL_ENERGY) + creep.room.terminal.energy) >= creep.carry[roomMineralType]);
    let sendEnergyToTerminal = creep => (
        creep.carry.energy > 0 &&        
        creep.room.storage.store.energy > ((MAX_STORAGE_ENERGY-MIN_STORAGE_ENERGY)/2)+MIN_STORAGE_ENERGY &&
        creep.room.terminal.store.energy < TERMINAL_ENERGY*0.95 && 
        (creep.room.terminal.storeCapacity - creep.room.terminal.sum) >= creep.carry[roomMineralType]);

    if( creep.room.terminal &&  
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
    return workResult;
};
action.onAssignment = function(creep, target) {
    if( SAY_ASSIGNMENT ) creep.say(String.fromCharCode(9739), SAY_PUBLIC); 
};
module.exports = action;