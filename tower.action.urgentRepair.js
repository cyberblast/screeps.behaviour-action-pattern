const action = class extends Tower.Action {
    
    isValidAction(tower) {
        return _.size(tower.room.urgentRepairable) > 0;
    }
    
    isValidTarget(target) {
        return target instanceof Structure && target.hits < target.hitsMax;
    }
    
    newTarget(tower) {
        return _(tower.room.urgentRepairable)
                .filter(this.isValidTarget)
                .min('hits') || undefined; // || undefined so we don't return Infinity.
    }
    
    work(tower) {
        return tower.repair(tower.target);
    }
    
};
module.exports = new action('urgentRepair');