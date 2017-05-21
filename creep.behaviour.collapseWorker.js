const mod = new Creep.Behaviour('collapseWorker');
module.exports = mod;
mod.inflowActions = (creep) => {
    let priority = [
        Creep.action.picking,
        Creep.action.withdrawing,
        Creep.action.uncharging,
        Creep.action.harvesting,
        Creep.action.dismantling,
        Creep.action.reallocating
    ];
    if (creep.sum > creep.carry.energy) {
        priority.unshift(Creep.action.storing);
    }
    return priority;
};
mod.outflowActions = (creep) => {
    const invasion = creep.room.situation.invasion && creep.room.controller && creep.room.controller.level > 2;
    if (invasion) {
        return [
            Creep.action.feeding,
            Creep.action.fueling,
            Creep.action.repairing
        ];
    } else {
        let priority = [
            Creep.action.feeding,
            Creep.action.fueling,
            Creep.action.charging,
            Creep.action.repairing,
            Creep.action.building,
            Creep.action.fortifying,
            Creep.action.upgrading,
        ];
        if(!invasion){
            priority.push(Creep.action.storing);
            priority.push(Creep.action.dropping);
        }
        if( creep.room.controller && creep.room.controller.ticksToDowngrade < 500 ) { // urgent upgrading
            priority.unshift(Creep.action.upgrading);
        }
        return priority;
    }
};
mod.needEnergy = creep => Creep.behaviour.worker.needEnergy.call(this, creep);
mod.nextAction = function(creep) {
    if (!creep.room.collapsed) {
        if( global.DEBUG && global.TRACE ) trace('Behaviour', {actionName:'recycling', behaviourName:this.name, creepName:creep.name, assigned: true, Behaviour:'nextAction', Action:'assign'});
        return this.assignAction(creep, 'recycling');
    }
    return Creep.behaviour.worker.nextAction.call(this, creep);
};
mod.strategies.defaultStrategy.canWithdrawEnergy = function(creep, target) {
    return function(amount) {
        return amount > 0;
    };
};
