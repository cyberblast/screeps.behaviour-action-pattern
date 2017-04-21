const action = class extends Creep.Action.Controller {

    isValidTarget(target) {
        return super.isValidTarget(target) && (!target.reservation || target.reservation.ticksToEnd < 4999);
    }
    
    isAddableTarget(target, creep) {
        return super.isAddableTarget(target) && (target instanceof StructureController && !target.owner);
    }
    
    newTarget(creep) {
        return super.newTarget(creep, flagEntry => Flag.compare(flagEntry, FLAG_COLOR.claim.reserve) || Flag.compare(flagEntry, FLAG_COLOR.invade.exploit));
    }
    
    work(creep) {
        this.sign(creep);
        
        const workMethod = this.validWorkTarget(creep) ? creep.attackController : creep.reserveController;
        
        return workMethod.call(creep, creep.target);
    }
    

};
module.exports = new action('reserving');