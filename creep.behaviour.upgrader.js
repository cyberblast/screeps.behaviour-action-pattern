const mod = new Creep.Behaviour('upgrader');
module.exports = mod;
mod.invalidCreep = c => ['miner', 'upgrader'].includes(c.data.creepType) && c.data.determinatedSpot &&
    (c.data.ttl > c.data.spawningTime || c.data.ttl > c.data.predictedRenewal);
mod.approach = function(creep) {
    let targetPos = new RoomPosition(creep.data.determinatedSpot.x, creep.data.determinatedSpot.y, creep.pos.roomName);
    let range = creep.pos.getRangeTo(targetPos);
    if( range > 0 ) {
        creep.data.movingToTarget = true;
        const creepAtSpot = targetPos.lookFor(LOOK_CREEPS);
        const targetRange =  creepAtSpot.length ? 1 : 0;
        if (range === 1) {
            if (creepAtSpot.length && _.some(creepAtSpot, mod.invalidCreep)) {
                // forget spots that have been improperly selected/unable to move to
                delete creep.data.determinatedSpot;
            }
        }
        creep.travelTo( targetPos, {range:targetRange} );
    } else if (creep.data.movingToTarget) {
        // we have arrived at our determinatedSpot
        creep.room.invalidateCostMatrix();
        delete creep.data.movingToTarget;
    }
    return range;
};
mod.run = function(creep) {
    if( creep.room.controller.upgradeBlocked ){
        creep.data.creepType='recycler';
        return;
    }
    if( !creep.action || creep.action.name !== 'upgrading' ) Population.registerAction(creep, Creep.action.upgrading, creep.room.controller);
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
                    where: pos => !_.some(pos.lookFor(LOOK_CREEPS), mod.invalidCreep) && (ignoreSources || pos.findInRange(creep.room.sources, 1).length === 0),
                    roomName: creep.pos.roomName
                };
                return Room.fieldsInRange(args);
            };
            let linkSpots = creep.room.structures.links.controller ? _.flatten(_.map(creep.room.structures.links.controller, getSpots)) : [];
            let containerSpots = creep.room.structures.container.controller ? _.flatten(_.map(creep.room.structures.container.controller, getSpots)) : [];
            let storageSpots = creep.room.storage ? getSpots(creep.room.storage) : [];
            let terminalSpots = creep.room.terminal ? getSpots(creep.room.terminal) : [];
            // priority = close to both link and a form of storage > close to link only > close to a form of storage only
            if (linkSpots.length) {
                let both = [];
                if (both.length === 0 && containerSpots.length) both = _.filter(linkSpots, l => _.some(containerSpots, c => c.isEqualTo(l)));
                if (both.length === 0 && storageSpots.length) both = _.filter(linkSpots, l => _.some(storageSpots, c => c.isEqualTo(l)));
                if (both.length === 0 && terminalSpots.length) both = _.filter(linkSpots, l => _.some(terminalSpots, c => c.isEqualTo(l)));
                return both.length ? both : linkSpots;
            }
            // priority: containers > storage > terminal
            return containerSpots.length ? containerSpots : (storageSpots.length ? storageSpots : terminalSpots);
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
                    const speed = creep.data.body ? Math.ceil(creep.data.body.work / (2 * creep.data.body.move)) : 1; // road assumed
                    if( path ) creep.data.predictedRenewal = creep.data.spawningTime + (path.length * speed);
                }
            }
        }
        if( !creep.data.determinatedSpot ) {
            logError('Unable to determine working location for upgrader in room ' + creep.pos.roomName);  
        } else if( global.SAY_ASSIGNMENT ) creep.say(String.fromCharCode(9962), global.SAY_PUBLIC);
    }
    if( creep.data.determinatedSpot ) {
        if(global.CHATTY) creep.say('upgrading', global.SAY_PUBLIC);
        let range = this.approach(creep);
        if( creep.room.controller && creep.pos.getRangeTo(creep.room.controller) <= 3){
            let carryThreshold = (creep.data.body&&creep.data.body.work ? creep.data.body.work : (creep.carryCapacity/2));
            if( creep.carry.energy <= carryThreshold ){
                let store = _.find(creep.room.structures.links.controller, s => s.energy > 0 && creep.pos.isNearTo(s));
                if( !store ) store = _.find(creep.room.structures.container.controller, s => s.store[RESOURCE_ENERGY] > 0 && creep.pos.isNearTo(s));
                if( !store ) {
                    store = creep.room.storage && creep.room.storage.charge > 0 &&
                        creep.pos.isNearTo(creep.room.storage);
                }
                if( !store ) {
                    store = creep.room.terminal && creep.room.terminal.store[RESOURCE_ENERGY] > 0.5 * TERMINAL_ENERGY && creep.pos.isNearTo(creep.room.terminal);
                }
                if( store ) creep.withdraw(store, RESOURCE_ENERGY);
            }
            creep.controllerSign();
            creep.upgradeController(creep.room.controller);
        }
    }
};
