module.exports = {
    name: 'upgrader',
    run: function(creep) {
        if( !creep.target ){
            let conts = creep.room.chargeablesOut;
            if( creep.room.storage) conts.push(creep.room.storage);
            let cont = creep.room.controller.pos.findInRange(conts, 3 ); 
            if( cont.length > 0 ) {
                Population.registerAction(creep, Creep.action.upgrading, cont[0]);
            }
        }
        if( creep.action && creep.target ) {
            if(CHATTY) creep.say('upgrading', SAY_PUBLIC);

            if( creep.pos.getRangeTo(creep.room.controller) <= 3 ) {
                let workResult = creep.upgradeController(creep.room.controller);
                if( [ERR_NOT_ENOUGH_RESOURCES, OK].includes(workResult) ) {
                } else {
                    if( DEBUG ) logErrorCode(creep, workResult);
                    creep.data.actionName = null;
                }
            }             
            if(creep.carry.energy < (creep.carryCapacity * 0.5) ) {
                let cont = creep.pos.findInRange(creep.room.chargeablesOut, 1, {
                    filter: function(c){ 
                        return c && c.store && c.store[RESOURCE_ENERGY] > 0;
                    }
                });
                if( cont ) creep.withdraw(cont[0], RESOURCE_ENERGY);
            } 
            let range = creep.pos.getRangeTo(creep.target);
            if( range > 0 )
                creep.action.drive(creep, creep.target.pos, 5);
        }
    }
}
