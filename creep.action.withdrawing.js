const action = class extends Creep.Action {
    
    constructor(...args) {
        super(...args);
        
        this.defaultStrategy.isValidAction = function(creep) {
            return !!(
                ((creep.room.storage && creep.room.storage.store[RESOURCE_ENERGY]) ||
                (creep.room.terminal && creep.room.terminal.store[RESOURCE_ENERGY])) &&
                creep.data.creepType !== 'privateer' &&
                creep.sum < creep.carryCapacity &&
                (!creep.room.conserveForDefense || creep.room.relativeEnergyAvailable < 0.8)
            );
        }
    }
    
    isValidAction(creep) {
        return creep.getStrategyHandler([this.name], 'isValidAction', creep);
    }
    
    isValidTarget(target) {
        if (target instanceof StructureTerminal && target.charge <= 0) return false;
        return super.isValidTarget(target) && !!target.store && target.store[RESOURCE_ENERGY];
    }
    
    newTarget(creep) {
        const terminal = creep.room.terminal;
        const storage = creep.room.storage;
        if (terminal && this.isValidTarget(terminal)) return terminal;
        if (terminal || storage) return _.max([terminal, storage], 'charge');
    }
    
    work(creep) {
        return creep.withdraw(creep.target, RESOURCE_ENERGY);
    }
    
    assignDebounce(creep, outflowActions) {
        const withdrawTarget = this.newTarget(creep);
        if (withdrawTarget) {
            if (withdrawTarget instanceof StructureStorage && creep.data.lastAction === 'storing' && creep.data.lastTarget === creep.room.storage.id) {
                // cycle detected
                const dummyCreep = {
                    carry: {},
                    owner: creep.owner,
                    pos: creep.pos,
                    room: creep.room,
                    sum: creep.carryCapacity,
                };
                const stored = creep.room.storage.store[RESOURCE_ENERGY];
                const maxWithdraw = Math.min(stored, creep.carryCapacity);
                dummyCreep.carry[RESOURCE_ENERGY] = maxWithdraw; // assume we get a full load of energy
                let nextTarget;
                const validAction = _.find(outflowActions, a => {
                    if (a.name !== 'storing' && a.isValidAction(dummyCreep) && a.isAddableAction(dummyCreep)) {
                        nextTarget = a.newTarget(dummyCreep);
                        return !!nextTarget;
                    }
                    return false;
                });
                if (validAction && this.assign(creep, withdrawTarget)) {
                    creep.data.nextAction = validAction.name;
                    creep.data.nextTarget = nextTarget.id;
                    return true;
                }
            } else {
                return this.assign(creep, withdrawTarget);
            }
        }
    }
    
};
module.exports = new action('withdrawing');