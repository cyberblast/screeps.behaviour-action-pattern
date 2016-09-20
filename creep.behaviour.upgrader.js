module.exports = {
    name: 'upgrader',
    run: function(creep) {
        if( creep.room.containerController ){                
            if(CHATTY) creep.say('upgrading', SAY_PUBLIC);

            let container = creep.room.containerController[0];
            let contRange = creep.pos.getRangeTo(container);
            let link = creep.room.linksController.length > 0 ? creep.room.linksController[0] : null;
            let linkRange = link ? creep.pos.getRangeTo(link) : null;
            let controllerRange = creep.pos.getRangeTo(creep.room.controller);

            if( link && linkRange < 2 && link.energy > 0 && creep.carry.energy <= (creep.data.body&&creep.data.body.work ? creep.data.body.work :  (creep.carryCapacity/2) )) 
                creep.withdraw(link, RESOURCE_ENERGY);
            else if( contRange < 2 && creep.carry.energy <= (creep.data.body&&creep.data.body.work ? creep.data.body.work :  (creep.carryCapacity/2) )) 
                creep.withdraw(container, RESOURCE_ENERGY);
            if( controllerRange < 4 ) 
                creep.upgradeController(creep.room.controller);
            if( contRange > 0 ) {
                creep.drive( container.pos, container.source === true ? 1 : 0, 1, contRange );
                // TODO: if( container occupied find alternate pos with range < 2 to link & cont & < 4 to controller)
            }
        } else {
            logError(`Upgrader ${creep.name} has no container in reach of the controller in room ${creep.pos.roomName}!`);
        }
    }
}