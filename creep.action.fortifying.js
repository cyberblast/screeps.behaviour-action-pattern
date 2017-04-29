const action = class extends Creep.Action.EnergyOut {
    
    constructor(...args) {
        super(...args);
        
        this.maxPerAction = 1;
        this.targetRange = 3;
    }
    
    isValidAction(creep) {
        return super.isValidAction(creep) && ((!creep.room.storage || !creep.room.storage.active) || creep.room.storage.charge > 0.6);
    }
    
    isValidTarget(target) {
        return super.isValidTarget(target) && target.active && target.hits && target.hits < target.hitsMax;
    }
    
    newTarget(creep) {
        const isAddable = target => this.isAddableTarget(target, creep);
        return _.find(creep.room.structures.fortifyable, isAddable);
    }
    
    work(creep) {
        return creep.repair(creep.target);
    }
    
};
module.exports = new action('fortifying');