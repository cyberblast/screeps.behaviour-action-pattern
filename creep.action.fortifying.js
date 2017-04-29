const action = class extends Creep.Action {
    
    constructor(...args) {
        super(...args);
        
        this.maxPerTarget = 1;
        this.maxPerAction = 1;
        this.targetRange = 3;
    }
    
    isValidAction(creep) {
        return creep.carry.energy > 0 && ((!creep.room.storage || !creep.room.storage.active) || creep.room.storage.charge > 0.6);
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