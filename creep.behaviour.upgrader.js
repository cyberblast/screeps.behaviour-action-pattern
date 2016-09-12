module.exports = {
    name: 'upgrader',
    run: function(creep) {
        if( creep.room.containerController ){                
            if(CHATTY) creep.say('upgrading', SAY_PUBLIC);

            let contRange = creep.pos.getRangeTo(creep.room.containerController[0]);
            let controllerRange = creep.pos.getRangeTo(creep.room.controller);

            if( contRange < 2 && creep.carry.energy <= (creep.data.body&&creep.data.body.work ? creep.data.body.work :  (creep.carryCapacity/2) )) 
                creep.withdraw(creep.room.containerController[0], RESOURCE_ENERGY);
            if( controllerRange < 4 ) 
                creep.upgradeController(creep.room.controller);
            if( contRange > 0 ) 
                Creep.action.upgrading.drive(creep, creep.room.containerController[0].pos, Infinity);
        } else {
            logError(`Upgrader ${creep.name} has no container in reach of the controller in room ${creep.pos.roomName}!`);
        }
    }
}