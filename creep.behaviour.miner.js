let mod = {};
module.exports = mod;
mod.name = 'miner';
mod.approach = function(creep){
    let targetPos = new RoomPosition(creep.data.determinatedSpot.x, creep.data.determinatedSpot.y, creep.data.homeRoom);
    let range = creep.pos.getRangeTo(targetPos);
    if( range > 0 )
        creep.drive( targetPos, 0, 0, range );
    return range;
};
mod.run = function(creep, params = {approach: mod.approach}) {
    let source;
    if( !creep.data.determinatedTarget ) { // select source
        let notDeterminated = source => {
            let hasThisSource = data => {
                const predictedRenewal = data.predictedRenewal ? data.predictedRenewal : data.spawningTime;
                return data.determinatedTarget == source.id && data.ttl > predictedRenewal;
            };
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
        if (!creep.action || creep.action.name !== 'harvesting') Population.registerAction(creep, Creep.action.harvesting, source);
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
                const predictedRenewal = entry.predictedRenewal ? entry.predictedRenewal : entry.spawningTime;
                if( entry.roomName == args.roomName && ['miner', 'upgrader'].includes(entry.creepType) && entry.determinatedSpot
                    && entry.ttl > predictedRenewal )
                    invalid.push(entry.determinatedSpot);
            };
            _.forEach(Memory.population, findInvalid);
            args.where = pos => !_.some(invalid,{x:pos.x,y:pos.y});

            if( source.container )
                args.spots.push({
                    pos: source.container.pos,
                    range: 1
                });
            if( !params.remote && source.link )
                args.spots.push({
                    pos: source.link.pos,
                    range: 1
                });
            let spots = Room.fieldsInRange(args);
            if( spots.length > 0 ){
                let spot = creep.pos.findClosestByPath(spots, {filter: pos => {
                    return !_.some(
                        creep.room.lookForAt(LOOK_STRUCTURES, pos),
                        {'structureType': STRUCTURE_ROAD }
                    );
                }});
                if( !spot ) spot = creep.pos.findClosestByPath(spots) || spots[0];
                if( spot ) {
                    creep.data.determinatedSpot = {
                        x: spot.x,
                        y: spot.y
                    };
                    if (!params.remote) {
                        let spawn = Game.spawns[creep.data.motherSpawn];
                        if( spawn ) {
                            let path = spot.findPathTo(spawn, {ignoreCreeps: true});
                            if( path ) creep.data.predictedRenewal = creep.data.spawningTime + path.length; // road assumed
                        }
                    }
                    if (MINERS_AUTO_BUILD && !source.container) {
                        const sites = _.filter(source.pos.findInRange(FIND_CONSTRUCTION_SITES, 2), s => s.structureType === STRUCTURE_CONTAINER);
                        if (!sites.length && source.room) {
                            source.room.createConstructionSite(spot, STRUCTURE_CONTAINER);
                        }
                    }
                }
            }
            if( !creep.data.determinatedSpot ) logError('Unable to determine working location for miner in room ' + creep.pos.roomName);
        }

        if( creep.data.determinatedSpot ) {
            const energyPerHarvest = creep => creep.data.body && creep.data.body.work ? (creep.data.body.work*2) : (creep.carryCapacity/2);
            if( source.energy === 0 ) {
                const carryThreshold = (creep.data.body&&creep.data.body.work ? (creep.data.body.work*5) : (creep.carryCapacity/2));
                if( creep.carry.energy <= carryThreshold ) {
                    const dropped = creep.pos.findInRange(FIND_DROPPED_ENERGY, 1);
                    if (dropped.length) {
                        if(CHATTY) creep.say('picking', SAY_PUBLIC);
                        creep.pickup(dropped[0]);
                    } else if (source.container && source.container.sum > 0) {
                        if(CHATTY) creep.say('withdraw cont', SAY_PUBLIC);
                        creep.withdraw(source.container, RESOURCE_ENERGY);
                    } else if (!params.remote && source.link && source.link.energy > 0) {
                        if(CHATTY) creep.say('withdraw link', SAY_PUBLIC);
                        creep.withdraw(source.link, RESOURCE_ENERGY);
                    } else if (creep.carry.energy === 0) {
                        if(CHATTY) creep.say('waiting', SAY_PUBLIC);
                        return; // idle
                    }
                    if (creep.carry.energy === 0) return; // we need at least some energy to do both in the same tick.
                }
                const targets = params.remote ? creep.room.structures.repairable : creep.room.structures.fortifyable;
                const repairs = creep.pos.findInRange(targets, 3);
                if (repairs.length) {
                    if(CHATTY) creep.say('repairing', SAY_PUBLIC);
                    return creep.repair(repairs[0]);
                }
                const sites = creep.pos.findInRange(creep.room.constructionSites, 3);
                if (sites.length) {
                    if(CHATTY) creep.say('building', SAY_PUBLIC);
                    return creep.build(sites[0]);
                }
                if(CHATTY) creep.say('waiting', SAY_PUBLIC);
                return; // idle
            } else if( !params.remote && source.link && source.link.energy < source.link.energyCapacity ) {
                if(CHATTY) creep.say('harvesting', SAY_PUBLIC);
                let range = params.approach(creep);
                if( range === 0 ){
                    if(creep.carry.energy > ( creep.carryCapacity - ( creep.data.body&&creep.data.body.work ? (creep.data.body.work*2) : (creep.carryCapacity/2) )))
                        creep.transfer(source.link, RESOURCE_ENERGY);
                    return creep.harvest(source);
                }
            } else if( source.container && source.container.sum < source.container.storeCapacity ) {
                if(CHATTY) creep.say('harvesting', SAY_PUBLIC);
                let range = params.approach(creep);
                if( range === 0 ){
                    if( creep.carry.energy > ( creep.carryCapacity - energyPerHarvest(creep) )){
                        let transfer = r => { if(creep.carry[r] > 0 ) creep.transfer(source.container, r); };
                        _.forEach(Object.keys(creep.carry), transfer);
                    }
                    return creep.harvest(source);
                }
            } else {
                if(CHATTY) creep.say('dropmining', SAY_PUBLIC);
                let range = params.approach(creep);
                if( range === 0 ){
                    if( creep.carry.energy > ( creep.carryCapacity - energyPerHarvest(creep) )) {
                        if( OOPS ) creep.say(String.fromCharCode(8681), SAY_PUBLIC);
                        let drop = r => { if(creep.carry[r] > 0 ) creep.drop(r); };
                        _.forEach(Object.keys(creep.carry), drop);
                    }
                    return creep.harvest(source);
                }
            }
        // move towards our source so we're ready to take over
        } else if (creep.pos.getRangeTo(source) > 3) return Creep.action.travelling.assign(creep, source);
    } else {
        // move inside the room so we don't block the entrance
        const flag = creep.data && creep.data.destiny ? Game.flags[creep.data.destiny.targetName] : null;
        if (flag && creep.pos.getRangeTo(flag) > 3) {
            creep.moveTo(flag);
            return Creep.action.travelling.assign(creep, flag);
        }
    }
};
