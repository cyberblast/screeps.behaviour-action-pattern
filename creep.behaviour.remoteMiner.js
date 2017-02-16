let mod = {};
module.exports = mod;
mod.name = 'remoteMiner';
mod.run = function(creep) {
    // assign Action
    if( creep.room.name == creep.data.destiny.room || creep.data.determinatedTarget ){
        // if we're there (or have been), be a miner.
        this.mine(creep);
        return;
    } else {
        // else go there
        Creep.action.travelling.assign(creep, Game.flags[creep.data.destiny.targetName]);
    }
    
    // Do some work
    if( creep.action && creep.target ) {
        creep.action.step(creep);
    } else {
        logError('Creep without action/activity!\nCreep: ' + creep.name + '\ndata: ' + JSON.stringify(creep.data));
    }
};
mod.mine = function(creep) {
    let source;
    if( !creep.data.determinatedTarget ) { // select source
        let notDeterminated = source => {
            let hasThisSource = data => data.determinatedTarget == source.id && data.ttl > 100;
            let existingBranding = _.find(Memory.population, hasThisSource);
            return !existingBranding;
        };
        source = _.find(creep.room.sources, notDeterminated);
        if( source ) {
            creep.data.determinatedTarget = source.id;
        }
        if( SAY_ASSIGNMENT ) creep.say(String.fromCharCode(9935), SAY_PUBLIC);
    } else { // get dedicated source
        source = Game.getObjectById(creep.data.determinatedTarget);
    }

    if( source ) {
        if( !creep.action ) Population.registerAction(creep, Creep.action.harvesting, source);
        if( !creep.data.determinatedSpot ) {
            let args = {
                spots: [{
                    pos: source.pos,
                    range: 1
                }],
                checkWalkable: true,
                where: null,
                roomName: creep.pos.roomName
            };

            let invalid = [];
            let findInvalid = entry => {
                if( entry.roomName == args.roomName && ['miner', 'upgrader'].includes(entry.creepType) && entry.determinatedSpot && entry.ttl > 100) {
                    invalid.push(entry.determinatedSpot);
                }
            };
            _.forEach(Memory.population, findInvalid);
            args.where = pos => !_.some(invalid,{x:pos.x,y:pos.y});

            if( source.container )
                args.spots.push({
                    pos: source.container.pos,
                    range: 1
                });
            let spots = Room.fieldsInRange(args);
            if( spots.length > 0 ){
                let spot = creep.pos.findClosestByPath(spots, {filter: pos => {
                    return _.some(
                        creep.room.lookForAt(LOOK_STRUCTURES, pos),
                        {'structureType': STRUCTURE_CONTAINER}
                    );
                }});
                if( !spot ) spot = creep.pos.findClosestByPath(spots) || spots[0];
                if( spot ) {
                    creep.data.determinatedSpot = {
                        x: spot.x,
                        y: spot.y
                    };
                }
            }
            if( !creep.data.determinatedSpot ) logError('Unable to determine working location for miner in room ' + creep.pos.roomName);
        }

        if( creep.data.determinatedSpot ) {
            const carrying = creep.sum;
            let energyPerHarvest = creep => creep.data.body && creep.data.body.work ? (creep.data.body.work*2) : (creep.carryCapacity/2);
            if( source.energy === 0 ) {
                if( carrying > 0 ) {
                    let repairs = creep.pos.findInRange(creep.room.structures.repairable, 3);
                    if (repairs.length) {
                        if(CHATTY) creep.say('repairing', SAY_PUBLIC);
                        return creep.repair(repairs[0]);
                    }
                    let sites = creep.pos.findInRange(creep.room.constructionSites, 3);
                    if (sites.length) {
                        if(CHATTY) creep.say('building', SAY_PUBLIC);
                        return creep.build(sites[0]);
                    }
                    if(CHATTY) creep.say('waiting', SAY_PUBLIC);
                    return; // idle
                } else {
                    let dropped = creep.pos.findInRange(FIND_DROPPED_ENERGY, 1);
                    if (dropped.length) {
                        if(CHATTY) creep.say('picking', SAY_PUBLIC);
                        return creep.pickup(dropped[0]);
                    }
                    if (source.container && source.container.sum > 0) {
                        if(CHATTY) creep.say('withdrawing', SAY_PUBLIC);
                        return creep.withdraw(source.container, RESOURCE_ENERGY);
                    }
                    if(CHATTY) creep.say('waiting', SAY_PUBLIC);
                    return; // idle
                }
            } else if( source.container && source.container.sum < source.container.storeCapacity ) {
                if(CHATTY) creep.say('harvesting', SAY_PUBLIC);
                let range = this.approach(creep);
                if( range === 0 ){
                    if( carrying > ( creep.carryCapacity - energyPerHarvest(creep) )){
                        let transfer = r => { if(creep.carry[r] > 0 ) creep.transfer(source.container, r); };
                        _.forEach(Object.keys(creep.carry), transfer);
                    }
                    creep.harvest(source);
                }
            } else {
                if(CHATTY) creep.say('dropmining', SAY_PUBLIC);
                let range = this.approach(creep);
                if( range === 0 ){
                    if( carrying > ( creep.carryCapacity - energyPerHarvest(creep) )) {
                        if( OOPS ) creep.say(String.fromCharCode(8681), SAY_PUBLIC);
                        let drop = r => { if(creep.carry[r] > 0 ) creep.drop(r); };
                        _.forEach(Object.keys(creep.carry), drop);
                    }
                    creep.harvest(source);
                }
            }
        }
    }
};
mod.approach = function(creep){
    let targetPos = new RoomPosition(creep.data.determinatedSpot.x, creep.data.determinatedSpot.y, creep.data.destiny.room);
    let range = creep.pos.getRangeTo(targetPos);
    if( range > 0 ) {
        creep.travelTo( targetPos, {range:0} );
        if( range <= 2 && !creep.data.predictedRenewal ) {
            creep.data.predictedRenewal = _.min([500, 1500 - creep.ticksToLive + creep.data.spawningTime]);
        }
    }
    return range;
};
