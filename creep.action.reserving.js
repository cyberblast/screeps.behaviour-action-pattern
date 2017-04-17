const action = class extends Creep.Action {

    isValidTarget(target) {
        return super.isValidTarget(target) && (!target.reservation || target.reservation.ticksToEnd < 4999);
    }
    
    isAddableTarget(target, creep) {
        return !!target && (target instanceof Flag || (target instanceof StructureController && !target.owner));
    }
    
    newTarget(creep) {
        const validColour = flagEntry => Flag.compare(flagEntry, FLAG_COLOR.claim.reserve) || Flag.compare(flagEntry, FLAG_COLOR.invade.exploit);
        
        let flag;
        // TODO: remove || creep.data.destiny.flagName (temporary backward compatibility)
        if (creep.data.destiny) flag = Game.flags[creep.data.destiny.targetName || creep.data.destiny.flagName];
        if (!flag) flag = FlagDir.find(validColour, creep.pos, false, FlagDir.reserveMod, creep.name);
        
        if (!flag) return;
        
        Population.registerCreepFlag(creep, flag);
        
        // not there, go to flagged room
        if (!creep.flag.room || creep.flag.pos.roomName !== creep.pos.roomName) return creep.flag;
        
        return creep.flag.room.controller;
    }
    
    step(creep) {
        this.chatty(creep);
        if (creep.target instanceof Flag) {
            if (creep.flag.pos.roomName === creep.pos.roomName) delete creep.data.targetId; // change target from flag to controller
            return creep.travelTo(creep.target.pos);
        }
        
        const range = creep.pos.getRangeTo(creep.target);
        if (range <= this.targetRange) {
            const workResult = this.work(creep);
            if (workResult !== OK) {
                creep.handleError({errorCode: workResult, action: this, target: creep.target, range, creep});
            }
            return workResult;
        }
        return creep.travelTo(creep.target.pos);
    }
    
    work(creep) {
        creep.controllerSign();
        
        const workMethod = creep.target.owner && !creep.target.my ? creep.attackController : creep.reserveController;
        
        return workMethod.call(creep, creep.target);
    }
    

};
module.exports = new action('reserving');