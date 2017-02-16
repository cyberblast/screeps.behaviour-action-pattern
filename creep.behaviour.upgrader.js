let mod = {};
module.exports = mod;
mod.name = 'upgrader';
let invalidCreep = c => ['miner', 'upgrader'].includes(c.data.creepType) && c.data.determinatedSpot &&
    (c.data.ttl > c.data.spawningTime || c.data.ttl > c.data.predictedRenewal);
mod.approach = function(creep){
    let targetPos = new RoomPosition(creep.data.determinatedSpot.x, creep.data.determinatedSpot.y, creep.pos.roomName);
    let range = creep.pos.getRangeTo(targetPos);
    if( range > 0 ) {
        if (range === 1) {
            const creeps = targetPos.lookFor(LOOK_CREEPS);
            if (creeps.length && _.some(creeps, invalidCreep)) {
                // forget spots that have been improperly selected/unable to move to
                delete creep.data.determinatedSpot;
            }
        }
        creep.drive( targetPos, 0, 0, range );
    }
    return range;
};
mod.run = function(creep) {
    if( creep.room.controller.upgradeBlocked ){
        creep.data.creepType='recycler';
        return;
    }
    if( !creep.action ) Population.registerAction(creep, Creep.action.upgrading, creep.room.controller);
    if( !creep.data.determinatedSpot ) {
        let determineSpots = (ignoreSources=false) => {
            let spots = [];
            let getSpots = s => {
                let args = {
                    spots: [{
                        pos: creep.room.controller.pos,
                        range: 3
                    },
                    {
                        pos: s.pos,
                        range: 1
                    }],
                    checkWalkable: true,
                    where: pos => !_.some(pos.lookFor(LOOK_CREEPS), invalidCreep) && (ignoreSources || pos.findInRange(creep.room.sources, 1).length === 0),
                    roomName: creep.pos.roomName
                };
                spots = spots.concat(Room.fieldsInRange(args));
            };
            if (creep.room.structures.container.controller) creep.room.structures.container.controller.forEach(getSpots);
            if (creep.room.structures.links.controller) creep.room.structures.links.controller.forEach(getSpots);
            return spots;
        };
        let spots = determineSpots();
        if( spots.length > 0 ){
            // allow spots near sources
            spots = determineSpots(true);
        }
        if (spots.length > 0) {
            // prefer off roads
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
                let spawn = Game.spawns[creep.data.motherSpawn];
                if( spawn ) {
                    let path = spot.findPathTo(spawn, {ignoreCreeps: true});
                    if( path ) creep.data.predictedRenewal = creep.data.spawningTime + path.length; // road assumed
                }
            }
        }
        if( !creep.data.determinatedSpot ) logError('Unable to determine working location for upgrader in room ' + creep.pos.roomName);
        else if( SAY_ASSIGNMENT ) creep.say(String.fromCharCode(9962), SAY_PUBLIC);
    }
    if( creep.data.determinatedSpot ) {
        if(CHATTY) creep.say('upgrading', SAY_PUBLIC);
        let range = this.approach(creep);
        if( creep.room.controller && creep.pos.getRangeTo(creep.room.controller) <= 3){
            let carryThreshold = (creep.data.body&&creep.data.body.work ? creep.data.body.work : (creep.carryCapacity/2));
            if( creep.carry.energy <= carryThreshold ){
                let store = creep.room.structures.links.controller.find(l => l.energy > 0);
                if( !store ) store = creep.room.structures.container.controller.find(l => l.store.energy > 0);
                if( store ) creep.withdraw(store, RESOURCE_ENERGY);
            }
            creep.controllerSign();
            creep.upgradeController(creep.room.controller);
        }
    }
};
