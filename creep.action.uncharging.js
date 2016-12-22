var action = new Creep.Action('uncharging'); // get from container
action.renewTarget = false;
action.isAddableAction = function(creep){ return true; }
action.isAddableTarget = function(target){ return true;}
action.isValidAction = function(creep){ return creep.sum < creep.carryCapacity; }
action.isValidTarget = function(target){
    return ( target &&
        (( target.structureType == 'container' && target.sum > 500 ) ||
        ( target.structureType == 'link' && target.energy > 0 )));
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
    let isAddable = target => that.isValidTarget(target);
    if( creep.room.structures.container.in.length > 0 ) {
        // take from fullest IN container having energy
        let target = null;
        let filling = 0;
        let fullest = cont => {
            let contFilling = cont.sum;
            if( cont.targetOf )
                contFilling -= _.sum( cont.targetOf.map( t => ( t.actionName == 'uncharging' ? t.carryCapacityLeft : 0 )));
            if( contFilling < Math.min(creep.carryCapacity - creep.sum, 500) ) return;
            if( contFilling > filling ){
                filling = contFilling ;
                target = cont;
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
        let max = creep.target.sum - (creep.target.storeCapacity * MANAGED_CONTAINER_TRIGGER);
        if( max < 1) workResult = ERR_NOT_ENOUGH_RESOURCES;
        else {
            let space = creep.carryCapacity - creep.sum;
            let amount = _.min([creep.target.store.energy, max, space]);
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
    return workResult;
};
action.onAssignment = function(creep, target) {
    //if( SAY_ASSIGNMENT ) creep.say(String.fromCharCode(9738), SAY_PUBLIC);
    if( SAY_ASSIGNMENT ) creep.say('\u{1F4E4}\u{FE0E}', SAY_PUBLIC);
};
module.exports = action;
