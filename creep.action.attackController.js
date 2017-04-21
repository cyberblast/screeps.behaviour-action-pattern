const action = class extends Creep.Action.Controller {
    
    constructor(...args) {
        super(...args);
        
        this.defaultStrategy.moveOptions = function(opts) {
            return opts;
        }
    }
    
    isValidTarget(target, creep) {
        return super.isValidTarget(target) && (!target.reservation || !Task.reputation.allyOwner(target.reservation)) && creep.flag;
    }
    
    isAddableTarget(target) {
        return super.isAddableTarget(target) && (target instanceof StructureController && (target.reservation || target.owner));
    }
    
    newTarget(creep) {
        return super.newTarget(creep, flagEntry => Flag.compare(flagEntry, FLAG_COLOR.invade.attackController));
    }
    
    work(creep) {
        this.sign(creep);
        
        const work = this.validWorkTarget(creep) || (creep.target.reservation && !Task.reputation.allyOwner(creep.target.reservation))
            ? creep.attackController
            : creep.claimController;
        return work.call(creep, creep.target);
    }
    
};
module.exports = new action('attackController');