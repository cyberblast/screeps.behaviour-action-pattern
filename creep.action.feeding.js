const action = class extends Creep.Action {
    
    constructor(...args) {
        super(...args);
        
        this.maxPerTarget = 1;
    }
    
    isValidAction(creep) {
        return creep.carry.energy > 0 && creep.room.energyAvailable < creep.room.energyCapacityAvailable;
    }
    
    isAddableTarget(target) {
        return target.my && super.isAddableTarget(target);
    }
    
    newTarget(creep) {
        if (creep.room.energyAvailable === creep.room.energyCapacityAvailable) {
            return;
        }
        return creep.pos.findClosestByRange(creep.room.structures.all, {
            filter: s => {
                return ((s instanceof StructureExtension || s instanceof StructureSpawn) &&
                this.isValidTarget(s) && this.isAddableTarget(s, creep));
            }
        });
    }
    
    work(creep) {
        let result = creep.transfer(creep.target, RESOURCE_ENERGY);
        if (result === OK && creep.carry.energy > creep.target.energyCapacity - creep.target.energy) {
            creep.target = null;
            this.assign(creep);
        }
        return result;
    }
    
};
module.exports = new action('feeding');