module.exports = {
    name: 'upgrader',
    run: function(creep) {
        if( creep.room.containerController ){                
            if(CHATTY) creep.say('upgrading', SAY_PUBLIC);

            let container = creep.room.containerController[0];
            let contRange = creep.pos.getRangeTo(container);
            let controllerRange = creep.pos.getRangeTo(creep.room.controller);

            if( contRange < 2 && creep.carry.energy <= (creep.data.body&&creep.data.body.work ? creep.data.body.work :  (creep.carryCapacity/2) )) 
                creep.withdraw(container, RESOURCE_ENERGY);
            if( controllerRange < 4 ) 
                creep.upgradeController(creep.room.controller);
            if( contRange > 0 ) 
                creep.drive( container.pos, container.source === true ? 1 : 0, 1, contRange );
        } else {
            logError(`Upgrader ${creep.name} has no container in reach of the controller in room ${creep.pos.roomName}!`);
        }
    }
}