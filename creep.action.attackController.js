const action = class extends Creep.Action {
    
    constructor(...args) {
        super(...args);
        
        this.defaultStrategy.moveOptions = function(opts) {
            return opts;
        }
    }
    
    isValidTarget(target, creep) {
        return super.isValidTarget(target) && (!target.reservation || !Task.reputation.allyOwner(target.reservation)) && creep.flag;
    }
    
    isAddableAction() {
        return true;
    }
    
    isAddableTarget(target) {
        return target && (target instanceof Flag || (target instanceof StructureController && (target.reservation || target.owner)));
    }
    
    newTarget(creep) {
        const validColour = flagEntry => Flag.compare(flagEntry, FLAG_COLOR.invade.attackController);
        
        let flag;
        if (creep.data.destiny) flag = Game.flags[creep.data.destiny.targetName];
        if (!flag) flag = FlagDir.find(validColour, creep.pos, false, FlagDir.reserveMod, creep.name);
        
        if (flag) {
            Population.registerCreepFlag(creep, flag);
        } else {
            return;
        }
        
        if (!creep.flag.room || creep.flag.pos.roomName !== creep.pos.roomName) {
            return creep.flag;
        }
        
        return creep.flag.room.controller;
    }
    
    step(creep) {
        if (CHATTY) creep.say(this.name, SAY_PUBLIC);
        if (creep.target.color) {
            if (creep.flag.pos.roomName === creep.pos.roomName) delete creep.data.targetId;
            creep.travelTo(creep.target);
            return;
        }
        const range = creep.pos.getRangeTo(creep.target);
        if (range <= this.targetRange) {
            const workResult = this.work(creep);
            if (workResult !== OK) {
                creep.handleError({errorCode: workResult, action: this, target: creep.target, range, creep});
            }
        } else {
            creep.travelTo(creep.target);
        }
    }
    
    work(creep) {
        creep.controllerSign();
        
        const work = (creep.target.owner && !creep.target.my) || (creep.target.reservation && !Task.reputation.allyOwner(creep.target.reservation))
            ? creep.attackController
            : creep.claimController;
        return work.call(creep, creep.target);
    }
    
};
module.exports = new action('attackController');