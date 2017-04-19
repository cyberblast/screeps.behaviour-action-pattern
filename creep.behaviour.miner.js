let mod = {};
module.exports = mod;
mod.name = 'miner';
mod.approach = function(creep){
    const targetPos = new RoomPosition(creep.data.determinatedSpot.x, creep.data.determinatedSpot.y, creep.data.homeRoom);
    const range = creep.pos.getRangeTo(targetPos);
    if (range > 0) {
        creep.data.movingToTarget = true;
        const targetRange = targetPos.lookFor(LOOK_CREEPS).length ? 1 : 0;
        if (range > targetRange) {
            creep.travelTo( targetPos, {range:targetRange} );
        }
    } else if (creep.data.movingToTarget) {
        // we have arrived at our determinatedSpot
        creep.room.invalidateCostMatrix();
        delete creep.data.movingToTarget;
    }
    return range;
};
mod.determineTarget = creep => {
    let notDeterminated = source => {
        let hasThisSource = data => {
            const predictedRenewal = data.predictedRenewal ? data.predictedRenewal : data.spawningTime;
            return data.determinatedTarget == source.id && data.ttl > predictedRenewal;
        };
        let existingBranding = _.find(Memory.population, hasThisSource);
            return !existingBranding;
    };
    const source = _.find(creep.room.sources, notDeterminated);
    if( source ) {
        creep.data.determinatedTarget = source.id;
    }
    if( SAY_ASSIGNMENT ) creep.say(String.fromCharCode(9935), global.SAY_PUBLIC);
};
mod.run = function(creep, params = {}) {
    if (_.isUndefined(params.approach)) params.approach = mod.approach;
    if (_.isUndefined(params.determineTarget)) params.determineTarget = mod.determineTarget;
    let source;
    if( !creep.data.determinatedTarget ) { // select source
        params.determineTarget(creep);
    } else { // get dedicated source
        source = Game.getObjectById(creep.data.determinatedTarget);
    }

    if( source ) {
        if (!creep.action || creep.action.name !== 'harvesting') Population.registerAction(creep, Creep.action.harvesting, source);
        if( !creep.data.determinatedSpot ) {
            let invalid = [];
            let findInvalid = entry => {
                const predictedRenewal = entry.predictedRenewal ? entry.predictedRenewal : entry.spawningTime;
                if( entry.roomName === creep.pos.roomName && ['miner', 'upgrader'].includes(entry.creepType) && entry.determinatedSpot
                    && entry.ttl > predictedRenewal )
                    invalid.push(entry.determinatedSpot);
            };
            _.forEach(Memory.population, findInvalid);
            const containerSpot = (source.container && source.container.pos.isNearTo(source)
                && !_.some(invalid,{x:source.container.pos.x, y:source.container.pos.y})) ? source.container.pos : null;
            let spots = [];
            let args;
            if (!containerSpot) {
                args = {
                    spots: [{
                        pos: source.pos,
                        range: 1
                    }],
                    checkWalkable: true,
                    where: pos => !_.some(invalid,{x:pos.x,y:pos.y}),
                    roomName: creep.pos.roomName
                };
                if( source.container ) {
                    args.spots.push({
                        pos: source.container.pos,
                        range: 1
                    });
                }
                if( !params.remote && source.link )
                    args.spots.push({
                        pos: source.link.pos,
                        range: 1
                    });
                spots = Room.fieldsInRange(args);
            }
            if (containerSpot || spots.length > 0) {
                let spot = containerSpot;
                if (!spot) {
                    spot = creep.pos.findClosestByPath(spots, {filter: pos => {
                        return !_.some(
                            creep.room.lookForAt(LOOK_STRUCTURES, pos),
                            {'structureType': STRUCTURE_ROAD }
                        );
                    }});
                }
                if (!spot) spot = creep.pos.findClosestByPath(spots) || spots[0];
                if (spot) {
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
            if( !creep.data.determinatedSpot ) {
                logError('Unable to determine working location for miner in room ' + creep.pos.roomName);
            }
        }

        if( creep.data.determinatedSpot ) {
            const range = params.approach(creep); // move to position if not in range
            const perHarvest = creep => creep.data.body && creep.data.body.work ? (creep.data.body.work*2) : (creep.carryCapacity/2);
            if( source.energy === 0 ) { // for mineral miners source.energy is undefined so this is false
                const carryThreshold = (creep.data.body&&creep.data.body.work ? (creep.data.body.work*5) : (creep.carryCapacity/2));
                if( creep.carry.energy <= carryThreshold ) {
                    const dropped = creep.pos.findInRange(FIND_DROPPED_ENERGY, 1);
                    if (dropped.length) {
                        if(global.CHATTY) creep.say('picking', global.SAY_PUBLIC);
                        creep.pickup(dropped[0]);
                    } else if (source.container && source.container.sum > 0) {
                        if(global.CHATTY) creep.say('withdraw cont', global.SAY_PUBLIC);
                        creep.withdraw(source.container, RESOURCE_ENERGY);
                    } else if (!params.remote && source.link && source.link.energy > 0) {
                        if(global.CHATTY) creep.say('withdraw link', global.SAY_PUBLIC);
                        creep.withdraw(source.link, RESOURCE_ENERGY);
                    } else if (creep.carry.energy === 0) {
                        if(global.CHATTY) creep.say('waiting', global.SAY_PUBLIC);
                        return; // idle
                    }
                    if (creep.carry.energy === 0) return; // we need at least some energy to do both in the same tick.
                }
                if (creep.data.repairTarget || !creep.data.repairChecked || Game.time - creep.data.repairChecked > MINER_WORK_THRESHOLD) {
                    let repairTarget = Game.getObjectById(creep.data.repairTarget);
                    if (!repairTarget || repairTarget.hits === repairTarget.hitsMax) {
                        const repairs = creep.pos.findInRange(FIND_STRUCTURES, 3, {
                            filter: s => (s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_ROAD) && s.hits < s.hitsMax
                        });
                        if (repairs.length) {
                            repairTarget = repairs[0];
                            creep.data.repairTarget = repairTarget.id;
                        } else repairTarget = null;
                    }
                    if (repairTarget) {
                        if(global.CHATTY) creep.say('repairing', global.SAY_PUBLIC);
                        return creep.repair(repairTarget);
                    } else {
                        delete creep.data.repairTarget;
                        creep.data.repairChecked = Game.time;
                    }
                }
                if (creep.data.buildTarget || !creep.data.buildChecked || Game.time - creep.data.buildChecked > MINER_WORK_THRESHOLD) {
                    let buildTarget = Game.getObjectById(creep.data.buildTarget);
                    if (!buildTarget || buildTarget.progress === buildTarget.progressMax) {
                        const sites = creep.pos.findInRange(creep.room.myConstructionSites, 3, {
                            filter: s => (s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_ROAD) && s.progress < s.progressMax
                        });
                        if (sites.length) {
                            buildTarget = sites[0];
                            creep.data.buildTarget = buildTarget.id;
                        } else buildTarget = null;
                    }
                    if (buildTarget) {
                        if(global.CHATTY) creep.say('building', global.SAY_PUBLIC);
                        return creep.build(buildTarget);
                    } else {
                        delete creep.data.buildTarget;
                        creep.data.buildChecked = Game.time;
                    }
                }
                if(global.CHATTY) creep.say('waiting', global.SAY_PUBLIC);
                return; // idle
            } else if( !params.remote && source.link && source.link.energy < source.link.energyCapacity ) {
                if(global.CHATTY) creep.say('harvesting', global.SAY_PUBLIC);
                if( range === 0 ){
                    if(creep.carry.energy > ( creep.carryCapacity - ( creep.data.body&&creep.data.body.work ? (creep.data.body.work*2) : (creep.carryCapacity/2) )))
                        creep.transfer(source.link, RESOURCE_ENERGY);
                    return creep.harvest(source);
                }
            } else if( source.container && source.container.sum < source.container.storeCapacity ) {
                if(global.CHATTY) creep.say('harvesting', global.SAY_PUBLIC);
                if( range === 0 ){
                    if( creep.sum > ( creep.carryCapacity - perHarvest(creep) )){
                        let transfer = r => { if(creep.carry[r] > 0 ) creep.transfer(source.container, r); };
                        _.forEach(Object.keys(creep.carry), transfer);
                    }
                    return creep.harvest(source);
                }
            } else {
                if(global.CHATTY) creep.say('dropmining', global.SAY_PUBLIC);
                if( range === 0 ){
                    if( creep.sum > ( creep.carryCapacity - perHarvest(creep) )) {
                        if( OOPS ) creep.say(String.fromCharCode(8681), global.SAY_PUBLIC);
                        let drop = r => { if(creep.carry[r] > 0 ) creep.drop(r); };
                        _.forEach(Object.keys(creep.carry), drop);
                    }
                    return creep.harvest(source);
                }
            }
        // move towards our source so we're ready to take over
        } else if (creep.pos.getRangeTo(source) > 3) {
            creep.data.travelRange = 3;
            return Creep.action.travelling.assign(creep, source);
        }
    }
};
