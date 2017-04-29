const EnergyInAction = class extends Creep.Action {
    
    isValidAction(creep) {
        return creep.sum < creep.carryCapacity;
    }
    
};
module.exports = EnergyInAction;