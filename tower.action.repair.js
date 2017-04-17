const action = class extends Tower.Action {
    
    isValidAction(tower) {
        return _.size(tower.room.structures.all) > 0;
    }
    
    isValidTarget(target) {
        return target instanceof Structure && target.hits < target.hitsMax;
    }
    
    newTarget(tower) {
        return _(tower.room.structures.all)
                .filter(this.isValidTarget)
                .min('hits') || undefined; // || undefined so we don't return Infinity.
    }
    
    work(tower) {
        return tower.repair(tower.target);
    }
    
};
module.exports = new action('urgentRepair');