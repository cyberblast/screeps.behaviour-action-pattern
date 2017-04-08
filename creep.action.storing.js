const action = class extends Creep.Action {
    
    isValidAction(creep) {
        return (
            !!creep.room.storage && creep.sum > 0 &&
            (
                creep.data.creepType !== 'worker' ||
                (
                    creep.sum > creep.carry[RESOURCE_ENERGY] ||
                    (
                        (
                            !creep.room.population ||
                            (
                                creep.room.population.actionCount.upgrading &&
                                creep.room.population.actionCount.upgrading >= 1
                            )
                        ) &&
                        creep.room.sourceEnergyAvailable > 0 && creep.room.storage.charge <= 1
                    )
                )
            )
        );
    }
    
    isValidTarget(target) {
        return super.isValidTarget(target) && target.store && target.sum < target.storeCapacity;
    }
    
    isAddableTarget(target, creep) {
        return target.my && super.isAddableTarget(target) && target.sum + creep.carry[RESOURCE_ENERGY] < target.storeCapacity;
    }
    
    isValidMineralToTerminal(room) {
        return room.storage.store[room.mineralType] &&
            room.storage.store[room.mineralType] > MAX_STORAGE_MINERAL * 1.05 &&
            (room.terminal.sum - room.terminal.store[RESOURCE_ENERGY]) + Math.max(room.terminal.store[RESOURCE_ENERGY], TERMINAL_ENERGY) < room.terminal.storeCapacity;
    }
    
    newTarget(creep) {
        const roomMineralType = creep.room.mineralType;
        const sendMineralToTerminal = () => !!creep.carry[roomMineralType] && this.isValidMineralToTerminal(creep.room);
        const sendEnergyToTerminal = () => !!creep.carry[RESOURCE_ENERGY] &&
            creep.room.storage.charge > 0.5 && creep.room.terminal.store[RESOURCE_ENERGY] < TERMINAL_ENERGY * 0.95 &&
            creep.room.terminal.sum < creep.room.terminal.storeCapacity;
        
        if (creep.room.terminal && (sendMineralToTerminal() || sendEnergyToTerminal()) && this.isAddableTarget(creep.room.terminal, creep)) {
            return creep.room.terminal;
        }
        if (this.isValidTarget(creep.room.storage) && this.isAddableTarget(creep.room.storage, creep)) {
            return creep.room.storage;
        }
    }
    
    work(creep) {
        let workResult;
        for (const resourceType in creep.carry) {
            if (creep.carry[resourceType] > 0) {
                workResult = creep.transfer(creep.target, resourceType);
                if (workResult !== OK) break;
            }
        }
        delete creep.data.actionName;
        delete creep.data.targetId;
        return workResult;
    }
    
};
module.exports = new action('storing');