var action = new Creep.Action('uncharging'); // get from container
action.renewTarget = false;
action.isAddableAction = function(creep){ return true; }
action.isAddableTarget = function(target){ return true;}
action.isValidAction = function(creep){ return _.sum(creep.carry) < creep.carryCapacity; }
action.isValidTarget = function(target){
    return ( target && 
        (( target.structureType == 'container' && _.sum(target.store) > 400 ) ||
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
        let filling = 0;
        let fullest = cont => {
            contFilling = _.sum(cont.store);
            if( cont.targetOf )
                contFilling -= _.sum( cont.targetOf.map( t => ( t.actionName == 'uncharging' ? t.carryCapacityLeft : 0 )));
            if( contFilling < Math.min(creep.carryCapacity - _.sum(creep.carry), 400) ) return;
            if( contFilling > filling ){
                filling = contFilling ;
                target = cont;
            }
        };
        _.forEach(creep.room.containerIn, fullest);
        return target;
    }
};
action.work = function(creep){
    let ret = OK;
    if (creep.target.store != null ) {
        let withdraw = r => {
            if( creep.target.store[r] > 0 )
                ret = creep.withdraw(creep.target, r);
        };
        _.forEach(Object.keys(creep.target.store), withdraw);
    } else {
        ret = creep.withdraw(creep.target, RESOURCE_ENERGY);
    }
    return ret;
};
action.onAssignment = function(creep, target) {
    if( SAY_ASSIGNMENT ) creep.say(String.fromCharCode(9738), SAY_PUBLIC); 
};
module.exports = action;
