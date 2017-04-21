const action = class extends Tower.Action {
    
    isValidAction(tower) {
        return _(tower.room.allCreeps).filter(c => c.hits < c.hitsMax).filter(c => Task.reputation.allyOwner(c)).filter(c => {
            return c.towers === undefined || c.towers.length === 0
            }).size() > 0 && !tower.room.situation.invasion;
    }
    
    isValidTarget(target) {
        return target instanceof Creep && Task.reputation.allyOwner(target) && target.hitsMax - target.hits >= 400;
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