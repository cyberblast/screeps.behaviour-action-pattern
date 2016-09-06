var mod = {
    extend: function(){   
        Creep.action.dropping = this.droppingAction();
        Creep.behaviour.miner.nextAction = this.minerBehaviourNextAction;
        Creep.behaviour.hauler.nextAction = this.haulerBehaviourNextAction;
        Creep.setup.hauler.maxCount = () => 2;
    }, 
    droppingAction: function() {
        var action = new Creep.Action('dropping');
        action.isValidAction = function(creep){
            return ( _.sum(creep.carry) == creep.carryCapacity);
        };
        action.isAddableAction = function(creep){ return true; };
        action.isAddableTarget = function(target){ return true; }; 
        action.step = function (creep) {
            if(HONK) creep.say("Ups..", SAY_PUBLIC);
            return creep.drop(RESOURCE_ENERGY);
        }
        action.newTarget = function ( creep) {
            return this
        }
        return action;
    }, 
    minerBehaviourNextAction: function(creep){
        let priority;
        if( creep.carry.energy == 0 ) { 
            priority = [
                Creep.action.harvesting];
        }
        else {	  
            priority = [
                Creep.action.storing, 
                Creep.action.feeding, 
                Creep.action.building, 
                Creep.action.repairing, 
                Creep.action.upgrading, 
                Creep.action.idle];
        }
        if( creep.room.population && creep.room.population.typeCount['hauler'] && creep.room.population.typeCount['hauler'] > 0 ) {
            priority.unshift(Creep.action.dropping);
        }
        for(var iAction = 0; iAction < priority.length; iAction++) {
            var action = priority[iAction];
            if(action.isValidAction(creep) && 
                action.isAddableAction(creep) && 
                action.assign(creep)) {
                    return;
            }
        }
    }, 
    haulerBehaviourNextAction: function(creep){
        let priority;
        if( creep.carry.energy == 0 ) { 
            priority = [
                Creep.action.uncharging, 
                Creep.action.withdrawing, 
                Creep.action.idle];
        }    
        else {	  
            priority = [
                Creep.action.picking, 
                Creep.action.feeding, 
                Creep.action.charging, 
                Creep.action.fueling, 
                Creep.action.storing, 
                Creep.action.idle];
            if( creep.room.controller && creep.room.controller.ticksToDowngrade < 2000 ) { // urgent upgrading 
                priority.unshift(Creep.action.upgrading);
            }
        }
        if( !creep.room.situation.invasion && _.sum(creep.carry) < creep.carryCapacity) {
            priority.unshift(Creep.action.picking);
        }
        if( _.sum(creep.carry) > creep.carry.energy ) {
            priority.unshift(Creep.action.storing);
        }
        for(var iAction = 0; iAction < priority.length; iAction++) {
            var action = priority[iAction];
            if(action.isValidAction(creep) && 
                action.isAddableAction(creep) && 
                action.assign(creep)) {
                    return;
            }
        }
    }
}
module.exports = mod;