const action = class extends Tower.Action {
    
    newTarget(tower) {
        return FlagDir.specialFlag();
    }
    
    step(tower) {
        delete tower.data.actionName;
        delete tower.data.targetId;
    }
    
};
module.exports = new action('idle');