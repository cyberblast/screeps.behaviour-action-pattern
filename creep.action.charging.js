let action = new Creep.Action('charging'); // store into container
module.exports = action;
action.renewTarget = false;
action.maxPerTarget = 1;
action.isValidAction = function(creep){ return creep.carry.energy > 0; }
action.isAddableAction = function(creep){ return true; }
action.isValidTarget = function(target){
    if( !target ) return false;
    if( target.structureType == STRUCTURE_LINK ){
        return target.energy < target.energyCapacity * 0.85;
    } else if( target.structureType == STRUCTURE_CONTAINER ) {
        return target.sum < ((target.source === true && target.controller == true) ? target.storeCapacity * MANAGED_CONTAINER_TRIGGER : target.storeCapacity);
    }
    return false;
};
const super_isAddableTarget = action.isAddableTarget;
action.isAddableTarget = function(target, creep){
    return super_isAddableTarget.apply(this, [target, creep]) &&
    (
        (target instanceof OwnedStructure && target.my) ||
        (
            (!creep.room.controller ||
                (
                    (!creep.room.controller.owner || creep.room.controller.my) &&
                    (!creep.room.controller.reservation || creep.room.controller.reservation.username == creep.owner.username)
                )
            )
        )
    ) && (
        (target.structureType == STRUCTURE_CONTAINER && (target.storeCapacity - target.sum) > Math.min(creep.carry.energy, 500)) ||
        ( target.structureType == STRUCTURE_LINK )
    ) && (
        target.structureType != STRUCTURE_CONTAINER || !target.controller || creep.carry.energy == creep.sum // don't put minerals in upgrader container
    );
};
action.newTarget = function(creep){
    // if storage link is not full & controller link < 15% => charge
    if( creep.room.structures.links.storage.length > 0 ){
        let linkStorage = creep.room.structures.links.storage.find(l => l.energy < l.energyCapacity * 0.85);
        if( linkStorage ){
            let emptyControllerLink = creep.room.structures.links.controller.find(l => l.energy <= l.energyCapacity * 0.15);
            if( emptyControllerLink && this.isValidTarget(linkStorage, creep) && this.isAddableTarget(linkStorage, creep) )
                return linkStorage;
        }
    }

    var that = this;
    if( creep.room.structures.container.out.length > 0 ) {
        let target = null;
        let maxFree = 0;
        var emptyest = o => {
            if( that.isValidTarget(o, creep) && that.isAddableTarget(o, creep) ) {
                let free = o.storeCapacity - o.sum;
                if( free > maxFree ){
                    maxFree = free;
                    target = o;
                }
            }
        };
        _.forEach(creep.room.structures.container.out, emptyest);
        return target;
    }
    return null;
};
action.work = function(creep){
    let workResult;
    if( creep.target.source === true && creep.target.controller == true ) {
        // don't overfill managed container'
        let max = (creep.target.storeCapacity * MANAGED_CONTAINER_TRIGGER) - creep.target.sum;
        
        if( max < 1) workResult = ERR_FULL;
        else {
            let amount = _.min([creep.carry.energy, max]);
            workResult = creep.transfer(creep.target, RESOURCE_ENERGY, amount);
            creep.target._sum += amount;
        }
    } else  workResult = creep.transfer(creep.target, RESOURCE_ENERGY);
    // unregister
    delete creep.data.actionName;
    delete creep.data.targetId;
    creep.action = null;
    creep.target = null;
    return workResult;
    /* container charging with minerals not supported currently
    var workResult;
    if( creep.target.structureType == STRUCTURE_CONTAINER ) {
        for(var resourceType in creep.carry) {
            if( creep.carry[resourceType] > 0 ){
                workResult = creep.transfer(creep.target, resourceType);
                if( workResult != OK ) break;
            }
        }
    } else if( creep.target.structureType == STRUCTURE_LINK ) {
        workResult = creep.transfer(creep.target, RESOURCE_ENERGY);
    }
    return workResult;
    */
};