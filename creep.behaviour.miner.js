module.exports = {
    name: 'miner',
    approach: function(creep){
        let targetPos = new RoomPosition(creep.data.determinatedSpot.x, creep.data.determinatedSpot.y, creep.pos.roomName);
        let range = creep.pos.getRangeTo(targetPos);
        if( range > 0 ) 
            creep.drive( targetPos, 0, 0, range );
        return range;
    },
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
            } else if ( creep.room.minerals != null ) {
                // assign to minerals
                creep.data.determinatedTarget = creep.room.minerals.id;
                Population.registerAction(creep, Creep.action.harvesting, source);
            }
        } else { // get dedicated source
            source = Game.getObjectById(creep.data.determinatedTarget);
            
            // do we mine a mineral deposit ?
             if ( !_.isUndefined(source.mineralType) ) {
                if (source.room.storage != null && source.room.storage.store[source.mineralType] > MINERALS_MAX_IN_STORE )
                    return;
            }
        }

        if( source ) {
            if( !creep.data.determinatedSpot ) { 
                let args = {
                    spots: [{
                        pos: source.pos, 
                        range: 1
                    }], 
                    checkWalkable: true, 
                    where: null, 
                    roomName: creep.pos.roomName
                }
                if( source.container )
                    args.spots.push({
                        pos: source.container.pos, 
                        range: 1
                    });
                if( source.link )
                    args.spots.push({
                        pos: source.link.pos, 
                        range: 1
                    });
                let spots = Room.fieldsInRange(args);
                if( spots.length > 0 ){
                    let spot = creep.pos.findClosestByPath(spots) || spots[0];
                    if( spot ) creep.data.determinatedSpot = {
                        x: spot.x, 
                        y: spot.y
                    }
                } 
                if( !creep.data.determinatedSpot ) logError('Unable to determine working location for miner in room ' + creep.pos.roomName);
            }

            if( creep.data.determinatedSpot ) {
                if( source.link && source.link.energy < source.link.energyCapacity ) {
                    if(CHATTY) creep.say('harvesting', SAY_PUBLIC);
                    let range = this.approach(creep);
                    if( range == 0 ){
                        if(creep.carry.energy > ( creep.carryCapacity - ( creep.data.body&&creep.data.body.work ? (creep.data.body.work*2) : (creep.carryCapacity/2) )))
                            creep.transfer(source.link, RESOURCE_ENERGY);
                        creep.harvest(source);
                    }
                } else if( source.container && _.sum(source.container.store) < source.container.storeCapacity ) {
                    if(CHATTY) creep.say('harvesting', SAY_PUBLIC);
                    let range = this.approach(creep);
                    if( range == 0 ){
                        if( creep.carry.energy > ( creep.carryCapacity - ( creep.data.body&&creep.data.body.work ? (creep.data.body.work*2) : (creep.carryCapacity/2) )))
                            creep.transfer(source.container, RESOURCE_ENERGY);
                        creep.harvest(source);
                    }
                } else if( creep.room.population && creep.room.population.typeCount['hauler'] && creep.room.population.typeCount['hauler'] > 0 ) {
                    if(CHATTY) creep.say('dropmining', SAY_PUBLIC);     
                    let range = this.approach(creep);      
                    if( range == 0 ){             
                        if( creep.carry.energy > ( creep.carryCapacity - 
                            ( creep.data.body&&creep.data.body.work ? (creep.data.body.work*2) : (creep.carryCapacity/2) ))) {
                            if( OOPS ) creep.say("Oops..", SAY_PUBLIC);
                            creep.drop(RESOURCE_ENERGY);
                        }
                        creep.harvest(source);
                    }
                } else { 
                    Creep.behaviour.worker.run(creep);
                } 
            }
        }
    }
}
