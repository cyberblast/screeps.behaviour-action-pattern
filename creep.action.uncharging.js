let action = new Creep.Action('uncharging'); // get from container/link
module.exports = action;
action.renewTarget = false;
action.maxPerTarget = 1;
action.isAddableAction = function(creep){ return true; }
action.isValidAction = function(creep){ return creep.sum < creep.carryCapacity; }
action.isValidTarget = function(target, creep){
    if( !target ) return false;
    if( target.structureType == 'link' ){
        return target.energy > 0;
    } else if( target.structureType == 'container' ) {
        let min = 0;
        if(target.source === true && target.controller == true) min = target.storeCapacity * MANAGED_CONTAINER_TRIGGER;
        else if( creep.data.creepType.indexOf('remote') >= 0 ) min = 250;
        else min = 500;
        return target.sum > min;
    }
    return false;
};
action.newTarget = function(creep){
    // if storage link is not empty & no controller link < 15% => uncharge
    if( creep.room.structures.links.storage.length > 0 ){
        let linkStorage = creep.room.structures.links.storage.find(l => l.energy > 0);
        if( linkStorage ){
            let emptyControllerLink = creep.room.structures.links.controller.find(l => l.energy < l.energyCapacity * 0.15);
            if( !emptyControllerLink || linkStorage.energy <= linkStorage.energyCapacity * 0.85 ) // also clear half filled
                return linkStorage;
        }
    }

    var that = this;
    if( creep.room.structures.container.in.length > 0 ) {
        let min;
        if( creep.data.creepType.indexOf('remote') >= 0 ) min = 250;
        else min = 500;
        // take from fullest IN container having energy
        let target = null;
        let currMax = 0;
        let fullest = cont => {
            if( that.isValidTarget(cont, creep) ){
                let available = cont.sum;
                if( cont.targetOf )
                    available -= _.sum( cont.targetOf.map( t => ( t.actionName == 'uncharging' ? t.carryCapacityLeft : 0 )));
                if( available < Math.min(creep.carryCapacity - creep.sum, min) ) return;
                if( available > currMax ){
                    currMax = available;
                    target = cont;
                }
            }
        };
        _.forEach(creep.room.structures.container.in, fullest);
        return target;
    }
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