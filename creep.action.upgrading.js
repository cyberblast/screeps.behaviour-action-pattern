const action = class extends Creep.Action {
    
    constructor(...args) {
        super(...args);
        
        this.targetRange = 3;
        this.reachedRange = 3;
    }
    
    isAddableAction(creep) {
        // no storage
        return !creep.room.storage ||
            // storage has surplus
            creep.room.storage.charge > 1 ||
            // storage is leftover from invasion and has usable energy
            (!creep.room.storage.my && creep.room.storage.store.energy > 0);
    }
    
    isAddableTarget(target, creep) {
        // limit to upgraders only at RCL8
        return !(target.level === 8 && (!creep.data || creep.data.creepType !== 'upgrader'));
    }
    
    isValidAction(creep) {
        return creep.carry.energy > 0;
    }
    
    isValidTarget(target) {
        return super.isValidTarget(target) && target instanceof StructureController && target.my;
    }
    
    newTarget(creep) {
        return creep.room.controller;
    }
    
    work(creep, range) {
        if (range && range < 2) creep.controllerSign();
        return creep.upgradeController(creep.target);
    }
    
};
module.exports = new action('upgrading');