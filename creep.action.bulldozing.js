const action = class extends Creep.Action {
    
    constructor(...args) {
        super(...args);
        this.maxPerAction = 2;
        this.maxPerTarget = 1;
    }
    
    isValidTarget(target) {
        if (!target.room.my && target.room.controller && target.room.controller.safeMode) return false;
        return target instanceof ConstructionSite && Task.reputation.notAlly(target.owner.username);
    }
    
    newTarget(creep) {
        const target = _(creep.room.constructionSites)
            .filter(this.isValidTarget)
            .max(target => {
                let rating;
                if (targer.structureType === STRUCTURE_SPAWN) {
                    rating = 20000;
                } else {
                    rating = 10000;
                }
                rating += target.progress / target.progressTotal * 10000;
                rating -= creep.pos.getRangeTo(target);
                return rating;
            });
        if (target instanceof ConstructionSite) return target;
    }
    
    work(creep) {
        return creep.move(creep.pos.getDirectionTo(creep.target));
    }
    
    onAssignment(creep) {
        if (SAY_ASSIGNMENT) creep.say(ACTION_SAY.BULLDOZING, SAY_PUBLIC);
    }
    
};
module.exports = new action('bulldozing');