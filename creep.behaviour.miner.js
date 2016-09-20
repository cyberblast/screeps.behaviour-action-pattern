module.exports = {
    name: 'miner',
    run: function(creep) {
        let source;
        if( !creep.data.determinatedTarget ) { // select source
            let notDeterminated = source => {
                let hasThisSource = data => { return data.determinatedTarget == source.id };
                let existingBranding = _.find(Memory.population, hasThisSource);
                return !existingBranding;
            };
            source = _.find(creep.room.sources, notDeterminated);
            if( source ) {
                creep.data.determinatedTarget = source.id;
            }
        } else { // get dedicated source
            source = Game.getObjectById(creep.data.determinatedTarget);
        }

        if( source && source.link && source.link.energy < source.link.energyCapacity )
        {
            if(CHATTY) creep.say('harvesting', SAY_PUBLIC);
            
            let linkRange = creep.pos.getRangeTo(source.link);
            let sourceRange = creep.pos.getRangeTo(source);

            if( linkRange < 2 && creep.carry.energy > ( creep.carryCapacity - ( creep.data.body&&creep.data.body.work ? (creep.data.body.work*2) : (creep.carryCapacity/2) )))
                creep.transfer(source.link, RESOURCE_ENERGY);
            if( sourceRange < 2 ) 
                creep.harvest(source);

            if( !creep.data.determinatedSpot ) { 
                let spots;
                if( source.container )
                    spots = Room.fieldsInRangeOfThree(source.pos, 1, source.link.pos, 1, source.container.pos, 1, true);
                else spots = Room.fieldsInRangeOfTwo(source.pos, 1, source.link.pos, 1, true);
                if( spots.length > 0 ){
                    creep.data.determinatedSpot = {
                        x: spots[0].x, 
                        y: spots[0].y
                    }
                }
            }

            if( creep.data.determinatedSpot ) { 
                let pos = new RoomPosition(creep.data.determinatedSpot.x, creep.data.determinatedSpot.y, source.pos.roomName);
                let range = creep.pos.getRangeTo(pos);
                if( range > 0 ) 
                    creep.drive( pos, 0, 0, range );
            } else {
                let contRange = creep.pos.getRangeTo(source.container);
                if(  source.container &&contRange  > 0 ) 
                    creep.drive( source.container.pos, 0, 0, contRange );
            }                 
        }
        else if( source && source.container && _.sum(source.container.store) < source.container.storeCapacity )
        {
            if(CHATTY) creep.say('harvesting', SAY_PUBLIC);

            let contRange = creep.pos.getRangeTo(source.container);
            let sourceRange = creep.pos.getRangeTo(source);

            if( contRange < 2 && creep.carry.energy > ( creep.carryCapacity - ( creep.data.body&&creep.data.body.work ? (creep.data.body.work*2) : (creep.carryCapacity/2) )))
                creep.transfer(source.container, RESOURCE_ENERGY);
            if( sourceRange < 2 ) 
                creep.harvest(source);
            if( contRange > 0 ) 
                creep.drive( source.container.pos, 0, 1, contRange );
        } else if( source && creep.room.population && creep.room.population.typeCount['hauler'] && creep.room.population.typeCount['hauler'] > 0 ) {
            if(CHATTY) creep.say('dropmining', SAY_PUBLIC);
            
            let sourceRange = creep.pos.getRangeTo(source);
            if( sourceRange < 2 ) 
                creep.harvest(source);
            else
                creep.drive( source.pos, 1, 1, sourceRange );

            if( creep.carry.energy > ( creep.carryCapacity - 
                ( creep.data.body&&creep.data.body.work ? (creep.data.body.work*2) : (creep.carryCapacity/2) ))) {
                if( OOPS ) creep.say("Oops..", SAY_PUBLIC);
                creep.drop(RESOURCE_ENERGY);
            }
        } else { 
            //if( DEBUG ) logError(`Miner ${creep.name} has no source in room ${creep.pos.roomName}!`);
            Creep.behaviour.worker.run(creep);
        }
    }
}