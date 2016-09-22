var action = new Creep.Action('uncharging'); // get from container
action.renewTarget = false;
action.isAddableAction = function(creep){ return true; }
action.isAddableTarget = function(target){ return true;}
action.isValidAction = function(creep){ return _.sum(creep.carry) < creep.carryCapacity; }
action.isValidTarget = function(target){
    return ( target && 
        (( target.structureType == 'container' && target.store.energy > 400 ) ||
        ( target.structureType == 'link' && target.energy > 0 )));
};   
action.newTarget = function(creep){ 
    // if storage link is not empty & no controller link < 15% => uncharge
    if( creep.room.linksStorage.length > 0 ){
        let linkStorage = creep.room.linksStorage.find(l => l.energy > 0);
        if( linkStorage ){
            let emptyControllerLink = creep.room.linksController.find(l => l.energy < l.energyCapacity * 0.15);
            if( !emptyControllerLink || linkStorage.energy <= linkStorage.energyCapacity * 0.85 ) // also clear half filled
                return linkStorage;
        }
    }

    var that = this;
    let isAddable = target => that.isValidTarget(target);    
    if( creep.room.containerIn.length > 0 ) {
        // take from fullest IN container having energy
        let target = null;
        let energy = 0;
        let fullest = cont => {
            if( cont.store.energy < Math.min(creep.carryCapacity - _.sum(creep.carry), 500) ) return;
            let e = cont.targetOf ? 
                cont.store.energy - _.sum( cont.targetOf.map( t => ( t.actionName == 'uncharging' ? t.carryCapacityLeft : 0 ))) : 
                cont.store.energy;
            if( e  > energy ){
                energy = e ;
                target = cont;
            }
        };
        _.forEach(creep.room.containerIn, fullest);
        return target;
    }
};
action.work = function(creep){
    return creep.withdraw(creep.target, RESOURCE_ENERGY);
};
module.exports = action;