module.exports = {
    name: 'upgrader',
    run: function(creep) {
        // get container @ controller
        if( !creep.data.conti ){
            let conts = creep.room.chargeablesOut;
            if( creep.room.storage) conts.push(creep.room.storage);
            let cont = creep.room.controller.pos.findInRange(conts, 3 ); 
            if( cont.length > 0 ) {
                creep.data.conti = cont[0].id;
            }
        }

        if( creep.data.conti ){                
            let container = Game.getObjectById(creep.data.conti);
            if( !container ){
                delete creep.data.conti;
                return;
            }
            if(CHATTY) creep.say('upgrading', SAY_PUBLIC);

            let contRange = creep.pos.getRangeTo(container);
            let controllerRange = creep.pos.getRangeTo(creep.room.controller);

            if( contRange < 2 && creep.carry.energy <= (creep.data.body&&creep.data.body.work ? creep.data.body.work : 50)) 
                creep.withdraw(container, RESOURCE_ENERGY);
            if( controllerRange < 4 ) 
                creep.upgradeController(creep.room.controller);
            if( contRange > 0 ) 
                Creep.action.upgrading.drive(creep, container.pos, Infinity);
        } else {
            logError(`Upgrader ${creep.name} has no container in reach of the controller in room ${creep.pos.roomName}!`);
        }
    }
}