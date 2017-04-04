const action = class extends Creep.Action {
    
    constructor(...args) {
        super(...args);
        this.maxPerTarget = 3;
        this.targetRange = 3;
        this.maxPerAction = 3;
        this.statement = ACTION_SAY.BUILDING;
    }
    
    isValidAction(creep) {
        return creep.carry.energy > 0;
    }
    
    isMineOrAlly(target) {
        return target.my || Task.reputation.allyOwner(target);
    }
    
    isValidTarget(target) {
        return super.isValidTarget(target) && this.isMineOrAlly(target) && target.progress && target.progress < target.progressTotal;
    }
    
    isAddableTarget(target) {
        // our site?
        return super.isAddableTarget(target) && this.isMineOrAlly(target);
    }
    
    newTarget(creep) {
        return creep.room.getBestConstructionSiteFor(creep.pos, target => this.isAddableTarget(target));
    }
    
    work(creep) {
        return creep.build(creep.target);
    }
    
};
module.exports = new Action('building');