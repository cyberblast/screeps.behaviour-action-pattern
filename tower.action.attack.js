const action = class extends Tower.Action {
    
    isValidAction(tower) {
        return _.size(tower.room.hostiles) > 0;
    }
    
    isValidTarget(target) {
        return target instanceof Creep && Task.reputation.hostileOwner(target);
    }
    
    newTarget(tower) {
        return _(tower.room.hostiles)
                .filter(this.isValidTarget)
                .max(c => {
                    if (c.hasBodyparts([ATTACK,RANGED_ATTACK,HEAL])) return 50;
                    return 10;
                }) || undefined; // || undefined so we don't return -Infinity.
    }
    
    work(tower) {
        return tower.attack(tower.target);
    }
    
};
module.exports = new action('attack');