const action = class extends Creep.Action {

    constructor(...args) {
        super(...args);
        
        this.maxPerTarget = 1;
        this.renewTarget = false;
    }
    
    isValidAction(creep) {
        return creep.sum < creep.carryCapacity;
    }
    
    isValidTarget(target, creep) {
        if (!super.isValidTarget(target)) return false;
        if (target instanceof StructureLink) {
            return target.energy > 0;
        }
        if (target instanceof StructureContainer) {
            let min = 500;
            if (target.source && target.controller) {
                min = target.storeCapacity * MANAGED_CONTAINER_TRIGGER;
            } else if (creep.data.creepType.includes('remote')) {
                min = 250;
            }
            return target.sum > min;
        }
    }
    
    newTarget(creep) {
        // if storage link is not empty & no controller link < 15% -> uncharge
        if (creep.room.structures.links.storage.length > 0) {
            const linkStorage = creep.room.structures.links.storage.find(l => l.energy > 0);
            if (linkStorage) {
                const emptyControllerLink = creep.room.structures.links.controller.find(l => l.energy < l.energyCapacity * 0.15);
                if (!emptyControllerLink || linkStorage.energy <= linkStorage.energyCapacity * 0.85) {
                    // also clear half filled
                    return linkStorage;
                }
            }
        }
        
        if (creep.room.structures.container.in.length > 0) {
            const min = creep.data.creepType.includes('remote') ? 250 : 500;
            // take from fullest IN container having energy
            let target = null;
            let currMax = 0;
            let fullest = cont => {
                if (!this.isValidTarget(cont, creep)) return;
                let available = cont.sum;
                if (cont.targetOf) available -= _.sum(cont.targetOf.map(t => (t.actionName === 'uncharging' ? t.carryCapacityLeft : 0)));
                if (available < Math.min(creep.carryCapacity - creep.sum, min)) return;
                if (available > currMax) {
                    currMax = available;
                    target = cont;
                }
            };
            _.forEach(creep.room.structures.container.in, fullest);
            return target;
        }
    }
    
    work(creep) {
        let workResult = OK;
        if (creep.target.source && creep.target.controller) {
            // managed contrainer fun...
            let max = creep.target.sum - creep.target.storeCapacity * (1 - MANAGED_CONTAINER_TRIGGER);
            if (max < 1) {
                workResult = ERR_NOT_ENOUGH_RESOURCES;
            } else {
                let space = creep.carryCapacity - creep.sum;
                let amount = Math.min(creep.target.store.energy, max, space);
                creep.target._sum -= amount;
                workResult = creep.withdraw(creep.target, RESOURCE_ENERGY, amount);
            }
        } else if (creep.target.store) {
            // container
            const withdraw = r => {
                if (creep.target.store[r] > 0) workResult = creep.withdraw(creep.target, r);
            };
            _.forEach(Object.keys(creep.target.store), withdraw);
        } else {
            // link
            workResult = creep.withdraw(creep.target, RESOURCE_ENERGY);
        }
        // unregister
        delete creep.data.actionName;
        delete creep.data.targetId;
        delete creep.action;
        delete creep.target;
        return workResult;
    }

};
module.exports = new action('uncharging');