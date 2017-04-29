const action = class extends Creep.Action {
    
    constructor(...args) {
        super(...args);
        
        this.maxPerAction = 1;
    }
    
    /**
     * Check to see if the mineralType has a boost
     */
    isValidMineralType(mineralType) {
        for (const category of Object.keys(BOOSTS)) {
            for (const compound of Object.keys(BOOSTS[category])) {
                if (mineralType === compound) return true;
            }
        }
        return false;
    }
    
    /**
     * Gets the part type matching the compound's boost
     */
    getBoostPartType(mineralType) {
        for (const category of Object.keys(BOOSTS)) {
            for (const compound of Object.keys(BOOSTS[category])) {
                if (mineralType === compound) return category;
            }
        }
    }
    
    canBoostType(creep, type) {
        return !_(creep.body).filter({type}).every(part => part.boost);
    }
    
    isValidAction(creep) {
        // only valid if not every part is boosted
        return !_.every(creep.body, part => part.boost);
    }
    
    isValidTarget(target, creep) {
        // target is lab and is addable
        return target instanceof StructureLab && this.isAddableTarget(target, creep) &&
            // target must be active
            target.active &&
            // target has the minimum energy and mineral
            target.energy >= LAB_BOOST_ENERGY && target.mineralAmount >= LAB_BOOST_MINERAL;
    }
    
    isAddableTarget(target, creep) {
        const boostPartType = this.getBoostPartType(target.mineralType);
        // mineralType is a boosting compound
        return super.isAddableTarget(target, creep) && this.isValidMineralType(target.mineralType) &&
            // creep has active body parts matching the mineralType's boost
            creep.hasActiveBodyparts(boostPartType) &&
            // can further boost parts of the mineralType's boost
            this.canBoostType(creep, boostPartType);
    }
    
    newTarget(creep) {
        return _(creep.room.structures.my)
            .filter(this.isValidTarget)
            .min(lab => creep.pos.getRangeTo(lab));
    }
    
    work(creep) {
        return creep.target.boostCreep(creep);
    }
    
};
module.exports = new action('boosting');