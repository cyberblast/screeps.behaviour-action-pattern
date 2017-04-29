const action = class extends Creep.Action.Controller {
    
    isValidTarget(target) {
        return !target.room || !target.owner;
    }
    
    isAddableTarget(target) {
        return Creep.Action.isAddableTarget.call(this, target);
    }
    
    newTarget(creep) {
        const s = super.newTarget(creep, FLAG_COLOR.claim);
        
        if (s instanceof Flag) return s;
        
        if (creep.flag.room.controller.my) { // TODO: AND is claim flag
            // already claimed, change flag
            // TODO: only if no spawn or spawn-constructionSite present
            creep.flag.setColor(FLAG_COLOR.claim.spawn.color, FLAG_COLOR.claim.spawn.secondaryColor);
            // TODO: remove exploit flags
            const remove = f => Game.flags[f.name].remove();
            _.forEach(FlagDir.filter(FLAG_COLOR.invade.exploit, creep.flag.pos), remove);
            // no valid target for claimer
            return;
        } else {
            // set controller as target
            return creep.flag.room.controller;
        }
    }
    
    work(creep) {
        this.sign(creep);
        
        return creep.claimController(creep.target);
    }
    
};
module.exports = new action('claiming');