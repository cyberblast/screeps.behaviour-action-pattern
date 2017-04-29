const EnergyOutAction = class extends Creep.Action {
    
    constructor(...args) {
        super(...args);
        
        this.maxPerTarget = 1;
    }
    
    isValidAction(creep) {
        return creep.carry.energy > 0;
    }
    
};
module.exports = EnergyOutAction;