const action = class extends Creep.Action {
    
    constructor(...args) {
        super(...args);
        
        this.renewTarget = false;
    }
    
    isValidAction(creep) {
        return creep.sum < creep.carryCapacity && creep.room.sourceEnergyAvailable > 0;
    }
    
    isValidTarget(target, creep) {
        return super.isValidTarget(target) && target.energy && target.energy > 0 &&
            (!target.targetOf ||
                (target.targetOf.length <= target.accessibleFields &&
                    !_.some(target.targetOf, c => (c.creepType === 'miner' || c.creepType === 'remoteMiner') &&
                        c.body.work >= 5 &&
                        (c.ticksToLive || CREEP_LIFE_TIME) >= (c.data && c.data.predictedRenewal || 0)
                    )
                )
            );
    }
    
    isAddableTarget(target, creep) {
        return (
            (!creep.room.controller ||
                (
                    (!creep.room.controller.owner || creep.room.controller.my) && // my room or not owned
                    (!creep.room.controller.reservation || creep.room.controller.reservation.username === creep.owner.username) // my reservation or none
                )
            )
        ) && (!target.targetOf || target.targetOf.length < target.accessibleFields);
    }
    
    newTarget(creep) {
        let target;
        let sourceGuests = 999;
        const roomSources = _.sortBy(creep.room.sources, s => creep.pos.getRangeTo(s));
        for (const source of roomSources) {
            if (this.isValidTarget(source, creep) && this.isAddableTarget(source, creep)) {
                if (!source.targetOf) {
                    sourceGuests = 0;
                    target = source;
                    break;
                }
                const guests = _.countBy(source.targetOf, 'creepType');
                const count = guests[creep.data.creepType];
                if (!count) {
                    sourceGuests = 0;
                    target = source;
                } else if (count < sourceGuests) {
                    sourceGuests = count;
                    target = source;
                }
            }
        }
        return target;
    }
    
    work(creep) {
        return creep.harvest(creep.target);
    }
    
};
module.exports = new action('harvesting');