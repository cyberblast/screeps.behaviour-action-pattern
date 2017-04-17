const action = class extends Tower.Action {
    
    isValidAction(tower) {
        return _(tower.room.allCreeps).filter(c => c.hits < c.hitsMax).filter(c => Task.reputation.allyOwner(c)).size() > 0;
    }
    
    isValidTarget(target) {
        return target instanceof Creep && Task.reputation.allyOwner(target) && target.hits < target.hitsMax;
    }
    
    newTarget(tower) {
        return _(tower.room.allCreeps)
            .filter(this.isValidTarget)
            .min('hits') || undefined; // || undefined so we don't return Infinity.
    }
    
    work(tower) {
        return tower.heal(tower.target);
    }
    
};
module.exports = new action('heal');