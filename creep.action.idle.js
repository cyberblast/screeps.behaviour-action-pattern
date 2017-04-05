const action = class extends Creep.Action {
    
    constructor(...args) {
        super(...args);
        
        this.targetRange = 3;
    }
    
    newTarget(creep) {
        return FlagDir.specialFlag();
    }
    
    step(creep) {
        if (CHATTY) creep.say(this.name, SAY_PUBLIC);
        creep.idleMove();
        delete creep.data.actionName;
        delete creep.data.targetId;
    }
    
};
module.exports = new action('idle');