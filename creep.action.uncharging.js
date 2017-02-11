let action = new Creep.Action('uncharging'); // get from container
module.exports = action;
action.renewTarget = false;
action.isAddableAction = function(creep){ return true; }
action.isAddableTarget = function(target){ return true;}
action.isValidAction = function(creep){ return creep.sum < creep.carryCapacity; }
action.isValidTarget = function(target, creep){
    const handler = creep.getStrategyHandler([action.name], 'isValidTarget', creep);
    return handler(target);
};
const superNewTarget = action.newTarget;
action.newTarget = function(creep){
    // if storage link is not empty & no controller link < 15% => uncharge
    if( creep.room.structures.links.storage.length > 0 ){
        let linkStorage = creep.room.structures.links.storage.find(l => l.energy > 0);
        if( linkStorage ){
            let emptyControllerLink = creep.room.structures.links.controller.find(l => l.energy < l.energyCapacity * 0.15);
            if( !emptyControllerLink || linkStorage.energy <= linkStorage.energyCapacity * 0.85 ) {// also clear half filled
                if( DEBUG && TRACE ) trace('Action', {creepName:creep.name, Action:action.name}, linkStorage.energy, 'priority link');
                return linkStorage;
            }
        }
    }

    return superNewTarget.apply(action, [creep]);
};
action.work = function(creep){
    let workResult = OK;
    if( creep.target.source === true && creep.target.controller == true ) {
        // managed container fun...
        let max = creep.target.sum - (creep.target.storeCapacity * (1-MANAGED_CONTAINER_TRIGGER));
        if( max < 1) workResult = ERR_NOT_ENOUGH_RESOURCES;
        else {
            let space = creep.carryCapacity - creep.sum;
            let amount = _.min([creep.target.store.energy, max, space]);
            creep.target._sum -= amount;
            workResult = creep.withdraw(creep.target, RESOURCE_ENERGY, amount);
        }
    } else if (creep.target.store != null ) {
        // container
        let withdraw = r => {
            if( creep.target.store[r] > 0 )
                workResult = creep.withdraw(creep.target, r);
        };
        _.forEach(Object.keys(creep.target.store), withdraw);
    } else { // link
        workResult = creep.withdraw(creep.target, RESOURCE_ENERGY);
    }
    // unregister
    delete creep.data.actionName;
    delete creep.data.targetId;
    creep.action = null;
    creep.target = null;
    return workResult;
};
action.onAssignment = function(creep, target) {
    //if( SAY_ASSIGNMENT ) creep.say(String.fromCharCode(9738), SAY_PUBLIC);
    if( SAY_ASSIGNMENT ) creep.say('\u{1F4E4}\u{FE0E}', SAY_PUBLIC);
};
action.defaultStrategy.isValidTarget = function(creep) {
    return function(target) {
        if (!target) return false;
        if (target.structureType == 'link') {
            return target.energy > 0;
        } else if (target.structureType == 'container') {
            const canWithdrawEnergy = creep.getStrategyHandler([action.name], 'canWithdrawEnergy', creep);
            const withdrawAmount = creep.getStrategyHandler([action.name], 'withdrawAmount', target);
            return canWithdrawEnergy(withdrawAmount);
        }
        return false;
    };
};
action.defaultStrategy.canWithdrawEnergy = function(creep) {
    const min = creep.data.body.carry * 25;
    return function(amount) {
        return creep.sum + amount >= min;
    };
};
action.defaultStrategy.withdrawAmount = function(target) {
    if (target.source === true && target.controller == true) {
        const amount = target.storeCapacity * (1 - MANAGED_CONTAINER_TRIGGER);
        if (target.sum > amount) {
            return target.sum - target.storeCapacity * MANAGED_CONTAINER_MINIMUM;
        } else {
            return 0;
        }
    }
    return target.sum;
};
action.defaultStrategy.targetPool = function(creep) {
    return creep.room.structures.container.in;
};
action.defaultStrategy.targetScore = function (creep) {
    // take from closest IN container that will put us to work
    const canWithdrawEnergy = creep.getStrategyHandler([action.name],'canWithdrawEnergy',creep);
    if (!canWithdrawEnergy) return;

    return function (target) {
        let contFilling = target.sum;
        if (target.targetOf)
            contFilling -= _.sum(target.targetOf.map(t => ( t.actionName == 'uncharging' ? t.carryCapacityLeft : 0 )));

        let score = -creep.pos.getRangeTo(target.pos);
        if ( !canWithdrawEnergy(contFilling)) score = 0;
        return {target, score};
    };
};
