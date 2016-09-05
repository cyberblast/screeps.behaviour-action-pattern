var action = new Creep.Action('upgrading');
action.targetRange = 3;
action.isAddableAction = function(creep){ return true; },
action.isAddableTarget = function(target){ return true; }, 
action.isValidAction = function(creep){
    return creep.carry.energy > 0;
};
action.isValidTarget = function(target){
    return (target != null ) && ( target.structureType == 'controller' || (target.structureType == 'container') ) && (target.my);
};   
action.newTarget = function(creep){
    return ( creep.room.controller && creep.room.controller.my) ? creep.room.controller : null;
};
action.work = function(creep){
    if( creep.data.creepType == "upgrader"){
        if(creep.carry.energy < creep.carryCapacity*0.5 ) {
            let cont = creep.pos.findInRange(creep.room.chargeablesOut, 1, {
                filter: function(c){ 
                    return c && c.store && c.store[RESOURCE_ENERGY] > 0;
                }
            });
            if( cont ) creep.withdraw(cont[0], RESOURCE_ENERGY);
        } 
        let result = creep.upgradeController(creep.room.controller);
        return result == ERR_NOT_ENOUGH_RESOURCES ? OK : result;
    }
    return creep.upgradeController(creep.room.controller);
}; 
action.step = function(creep){
    if(CHATTY) creep.say(this.name, SAY_PUBLIC);
    let range = creep.pos.getRangeTo(creep.target);
    if( range <= this.targetRange ) {
        var workResult = this.work(creep);
        if( workResult != OK ) {
            if( DEBUG ) logErrorCode(creep, workResult);
            creep.data.actionName = null;
        }
    } 
    if( range > 1 || (range== 1 && creep.data.creepType == "upgrader" && creep.target.structureType == 'container' ))
        this.drive(creep, creep.target.pos, range);
};

module.exports = action;
