const action = class extends Creep.Action {
    
    constructor(...args) {
        super(...args);
        
        this.statement = ACTION_SAY.CLAIMING;
    }
    
    isValidTarget(target) {
        return !target.room || !target.owner;
    }
    
    newTarget(creep) {
        let flag;
        // TODO: remove || creep.data.destiny.flagName (temporary backward compatibility)
        if (creep.data.destiny) flag = Game.flags[creep.data.destiny.targetName || creep.data.destiny.flagName];
        if (!flag) flag = FlagDir.find(FLAG_COLOR.claim, creep.pos, false, FlagDir.claimMod, creep.name);
        
        if (!flag) return;
        
        Population.registerCreepFlag(creep, flag);
        
        if (!creep.flag.room || creep.flag.pos.roomName !== creep.pos.roomName) return creep.flag;
        
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
    
    step(creep) {
        if (CHATTY) creep.say(this.name, SAY_PUBLIC);
        if (creep.target.color) {
            if (creep.flag.pos.roomName === creep.pos.roomName) { // change target from flag to controller
                delete creep.data.targetId;
            }
            creep.travelTo(creep.target.pos);
            return;
        }
        
        const range = creep.pos.getRangeTo(creep.target);
        if (range <= this.targetRange) {
            const workResult = this.work(creep);
            if (workResult !== OK) {
                creep.handleError({errorCode: workResult, action: this, target: creep.target, range, creep});
            }
        }
        creep.travelTo(creep.target.pos);
    }
    
    work(creep) {
        creep.controllerSign();
        
        return creep.claimController(creep.target);
    }
    
};
module.exports = new action('claiming');