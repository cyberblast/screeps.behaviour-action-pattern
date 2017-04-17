const action = class extends Creep.Action {
    
    constructor(...args) {
        super(...args);
        
        this.renewTarget = false;
        this.maxPerTarget = 1;
    }
    
    isValidAction(creep) {
        return creep.carry.energy > 0;
    }
    
    isValidTarget(target) {
        if (super.isValidTarget(target)) return false;
        if (target instanceof StructureLink) {
            return target.energy < target.energyCapacity * 0.85;
        }
        if (target instanceof StructureContainer) {
            return target.sum < ((target.source === true && target.controller === true)
                ? target.storeCapacity * MANAGED_CONTAINER_TRIGGER
                : target.storeCapacity);
        }
        return false;
    }
    
    isAddableTarget(target, creep) {
        return super.isAddableTarget(target, creep) && (
            (target instanceof OwnedStructure && target.my) ||
            (
                (!creep.room.controller ||
                (
                    (!creep.room.controller.owner || creep.room.controller.my) &&
                    (!creep.room.controller.reservation || creep.room.controller.reservation.username === creep.owner.username)
                ))
            )
        ) && (
                (target instanceof StructureContainer && (target.storeCapacity - target.sum) > Math.min(creep.carry.energy, 500)) ||
                (target instanceof StructureLink)
            ) && (
                !(target instanceof StructureContainer) || !target.controller || creep.carry.energy === creep.sum
            );
    }
    
    newTarget(creep) {
        // if storage link is not full & controller link < 15% => charge
        if (creep.room.structures.links.storage.length > 0) {
            const linkStorage = creep.room.structures.links.storage.find(l => l.energy < l.energyCapacity * 0.85);
            if (linkStorage) {
                const emptyControllerLink = creep.room.structures.links.controller.find(l => l.energy < l.energyCapacity * 0.15);
                if (emptyControllerLink) {
                    return linkStorage;
                }
            }
        }
        
        if (creep.room.structures.container.out.length > 0) {
            let target;
            let maxFree = 0;
            const emptiest = o => {
                if (this.isValidTarget(o) && this.isAddableTarget(o, creep)) {
                    const free = o.storeCapacity - o.sum;
                    if (free > maxFree) {
                        maxFree = free;
                        target = o;
                    }
                }
            };
            _.forEach(creep.room.structures.container.out, emptiest);
            return target;
        }
    }
    
    work(creep) {
        let workResult;
        if (creep.target.source === true && creep.target.controller === true) {
            // don't overfill managed container
            const max = creep.target.storeCapacity * MANAGED_CONTAINER_TRIGGER - creep.target.sum;
            
            if (max < 1) {
                workResult = ERR_FULL;
            } else {
                const amount = Math.min(creep.carry.energy, max);
                workResult = creep.transfer(creep.target, RESOURCE_ENERGY, amount);
                creep.target.sum += amount;
            }
        } else {
            workResult = creep.transfer(creep.target, RESOURCE_ENERGY);
        }
        
        // unregister
        delete creep.data.actionName;
        delete creep.data.targetId;
        creep.action = null;
        creep.target = null;
        return workResult;
    }
    
};
module.exports = new action('charging');