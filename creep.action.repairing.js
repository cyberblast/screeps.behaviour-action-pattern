const action = class extends Creep.Action.EnergyOut {
    
    constructor(...args) {
        super(...args);
    
        this.targetRange = 3;
    }
    
    isValidTarget(target) {
        return super.isValidTarget(target) && target.hits && target.hits < target.hitsMax;
    }
    
    isAddableTarget(target, creep) {
        return (
            (target instanceof OwnedStructure && target.my) ||
            (
                (!creep.room.controller ||
                (
                    (!creep.room.controller.owner || creep.room.controller.my) &&
                    (!creep.room.controller.reservation || creep.room.controller.reservation.username === creep.owner.username)
                ))
            )
        ) && super.isAddableTarget(target, creep);
    }
    
    newTarget(creep) {
        return _.find(creep.room.structures.urgentRepairable, target => this.isAddableTarget(target, creep));
    }
    
    work(creep) {
        return creep.repair(creep.target);
    }
    
};
module.exports = new action('repairing');