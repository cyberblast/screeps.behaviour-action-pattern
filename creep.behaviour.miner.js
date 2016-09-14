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

        if( source && source.container && _.sum(source.container.store) < source.container.storeCapacity )
        {
            if(CHATTY) creep.say('harvesting', SAY_PUBLIC);
            
            let contRange = creep.pos.getRangeTo(source.container);
            let sourceRange = creep.pos.getRangeTo(source);

            if( contRange < 2 && creep.carry.energy > ( creep.carryCapacity - ( creep.data.body&&creep.data.body.work ? (creep.data.body.work*2) : (creep.carryCapacity/2) )))
                creep.transfer(source.container, RESOURCE_ENERGY);
            if( sourceRange < 2 ) 
                creep.harvest(source);
            if( contRange > 0 ) 
                Creep.action.upgrading.drive(creep, source.container.pos, contRange, 0, 0);
        } else if( source && creep.room.population && creep.room.population.typeCount['hauler'] && creep.room.population.typeCount['hauler'] > 0 ) {
            if(CHATTY) creep.say('dropmining', SAY_PUBLIC);
            
            let sourceRange = creep.pos.getRangeTo(source);
            if( sourceRange < 2 ) 
                creep.harvest(source);
            else
                Creep.action.upgrading.drive(creep, source.pos, sourceRange, 1, 1);

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