const action = class extends Creep.Action {
    
    constructor(...args) {
        super(...args);
        
        this.maxPerAction = 4;
        this.maxPerTarget = 2;
        
        this.defaultStrategy.energyOnly = true;
    }
    
    isValidAction(creep) {
        return creep.sum < creep.carryCapacity;
    }
    
    isValidTarget(target) {
        return super.isValidTarget(target) && !!target.amount;
    }
    
    isAddableAction(creep) {
        if (creep.data.creepType.indexOf('remote') > 0) return true;
        return super.isAddableAction(creep);
    }
    
    isAddableTarget(target, creep) {
        const max = creep.data.creepType.indexOf('remote') > 0 ? Infinity : this.maxPerTarget;
        const pickers = target.targetOf ? _.filter(target.targetOf, {actionName: 'picking'}) : [];
        return !target.targetOf || !pickers.length || (pickers.length < max && target.amount > _.sum(pickers.map(t => t.carryCapacityLeft)));
    }
    
    newTarget(creep) {
        const droppedResources = this.getStrategy('energyOnly', creep) ? _.filter(creep.room.droppedResources, {resourceType: RESOURCE_ENERGY}) : creep.room.droppedResources;
        let filter;
        if (creep.room.my && creep.room.situation.invasion) {
            // pickup near sources only
            filter = o => this.isAddableTarget(o, creep) && o.pos.findInRange(creep.room.sources, 1).length > 0;
        } else {
            filter = o => this.isAddableTarget(o, creep);
        }
        return creep.pos.findClosestByPath(droppedResources, {filter});
    }
    
    work(creep) {
        const result = creep.pickup(creep.target);
        if (result === OK) {
            if (creep.sum < creep.carryCapacity * 0.8) {
                // is there another in range?
                let loot = creep.pos.findInRange(creep.room.droppedResources, 1, {
                    filter: o => o.resourceType !== RESOURCE_ENERGY && this.isAddableTarget(o, creep)
                });
                if (!loot || loot.length < 1) loot = creep.pos.findInRange(creep.room.droppedResources, 1, {
                    filter: o => this.isAddableTarget(o, creep)
                });
                if (loot && loot.length > 0) {
                    this.assign(creep, loot[0]);
                    return result;
                }
            }
            // Check for containers to uncharge
            if (creep.sum < creep.carryCapacity) {
                let containers = creep.pos.findInRange(creep.room.structures.container.in, 2, {
                    filter: o => Creep.action.uncharging.isValidTarget(o, creep)
                });
                if (containers && containers.length > 0) {
                    Creep.action.uncharging.assign(creep, containers[0]);
                    return result;
                }
            }
            // unregister
            delete creep.data.actionName;
            delete creep.data.targetId;
        }
        return result;
    }
    
};
module.exports = new action('picking');