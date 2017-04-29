const action = class extends Creep.Action.EnergyOut {
    
    constructor(...args) {
        super(...args);
        
        this.maxPerAction = 1;
    }
    
    isValidAction(creep) {
        return super.isValidAction(creep) && creep.room.towerFreeCapacity > 0;
    }
    
    isValidTarget(target) {
        return super.isValidTarget(target) && target.active && target.energy && target.energy < target.energyCapacity;
    }
    
    isAddableTarget(target) {
        return target.my && this.isAddableTarget(target);
    }
    
    newTarget(creep) {
        return creep.room.structures.fuelable.length ? creep.pos.findClosestByRange(creep.room.structures.fuelable) : null;
    }
    
    work(creep) {
        const response = creep.transfer(creep.target, RESOURCE_ENERGY);
        if (creep.target.energyCapacity - creep.target.energy < 20) delete creep.data.targetId;
        return response;
    }
    
};
module.exports = new action('fueling');