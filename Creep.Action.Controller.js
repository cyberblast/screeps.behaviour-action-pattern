const ControllerAction = class extends Creep.Action {
    
    sign(creep) {
        creep.controllerSign();
    }
    
    isAddableTarget(target, creep) {
        return super.isValidTarget(target) && (target instanceof Flag || (target instanceof StructureController));
    }
    
    newTarget(creep, filter) {
        let flag;
        if (creep.data.destiny) flag = Game.flags[creep.data.destiny.targetName];
        if (!flag) flag = FlagDir.find(filter, creep.pos, false, FlagDir.reserveMod, creep.name);
        
        if (!flag) return;
        
        Population.registerCreepFlag(creep, flag);
        
        // not there, go to flagged room
        if (!creep.flag.room || creep.flag.pos.roomName !== creep.pos.roomName) return creep.flag;
        
        return creep.flag.room.controller;
    }
    
    step(creep) {
        this.chatty(creep);
        if (creep.target instanceof Flag) {
            if (creep.flag.pos.roomName === creep.pos.roomName) delete creep.data.targetId; // change target from flag to  controller
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
    
    validWorkTarget(creep) {
        return creep.target.owner && !creep.target.my;
    }
    
};
module.exports = ControllerAction;
