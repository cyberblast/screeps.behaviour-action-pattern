const action = class extends Creep.Action {
    
    isValidTarget(target) {
        return super.isValidTarget(target) && target.hits && target.hits < target.hits && target.my;
    }
    
    newTarget(creep) {
        if (creep.room.casualties.length > 0) {
            return creep.room.casualties[0];
        }
    }
    
    work(creep) {
        if (creep.target.hits < creep.target.hitsMax) {
            if (creep.pos.isNearTo(creep.target)) {
                return creep.heal(creep.target);
            }
            if (creep.pos.inRangeTo(creep.target, 3)) {
                return creep.rangedHeal(creep.target);
            }
            return OK;
        }
    }

};
module.exports = new action('healing');