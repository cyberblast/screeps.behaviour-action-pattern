const action = class extends Creep.Action {
    
    isValidAction(creep) {
        return (
            ((creep.room.storage && creep.room.storage.store[RESOURCE_ENERGY]) ||
            (creep.room.terminal && creep.room.terminal.store[RESOURCE_ENERGY])) &&
            creep.data.creepType !== 'privateer' &&
            creep.sum < creep.carryCapacity &&
            (!creep.room.conserveForDefense || creep.room.relativeEnergyAvailable < 0.8)
        );
    }
    
    isValidTarget(target) {
        if (target instanceof StructureTerminal && target.charge <= 0) return false;
        return super.isValidTarget(target) && !!target.store && target.store[RESOURCE_ENERGY];
    }
    
    newTarget(creep) {
        const validTargets = [creep.room.storage, creep.room.terminal].filter(this.isValidTarget);
        if (validTargets.length) return _.max(validTargets, 'charge');
    }
    
    work(creep) {
        return creep.withdraw(creep.target, RESOURCE_ENERGY);
    }
    
    assignDebounce(creep, outflowActions) {
        if (creep.data.lastAction === 'storing' && creep.data.lastTarget === creep.room.storage.id) {
            // cycle detected
            const dummyCreep = {
                carry: {},
                owner: creep.owner,
                pos: creep.pos,
                room: creep.room,
                sum: creep.carryCapacity,
            };
            const stored = creep.room.storage.store[RESOURCE_ENERGY];
            dummyCreep.carry[RESOURCE_ENERGY] = stored > creep.carryCapacity ? creep.carryCapacity : stored; // assume we get a full load of energy
            let target;
            const validAction = _.find(outflowActions, a => {
                if (a.name !== 'storing' && a.isValidAction(dummyCreep) && a.isAddableAction(dummyCreep)) {
                    target = a.newTarget(dummyCreep);
                    return !!target;
                }
                return false;
            });
            if (validAction && this.assign(creep)) {
                creep.data.nextAction = validAction.name;
                creep.data.nextTarget = target.id;
                return true;
            }
        } else {
            return this.assign(creep);
        }
        return false;
    }
    
};
module.exports = new action('withdrawing');