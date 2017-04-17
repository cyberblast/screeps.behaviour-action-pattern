const mod = {};
module.exports = mod;
mod.minControllerLevel = 2;
mod.name = 'mining';
mod.register = () => {};
mod.handleFlagRemoved = flagName => {
    // check flag
    const flagMem = Memory.flags[flagName];
    if( flagMem && flagMem.task === mod.name && flagMem.roomName ){
        // if there is still a mining flag in that room ignore. 
        const flags = FlagDir.filter(FLAG_COLOR.claim.mining, new RoomPosition(25,25,flagMem.roomName), true);
        if( flags && flags.length > 0 ) 
            return;
        else {
            // no more mining in that room.
            Task.cleanup(['remoteMiner', 'remoteWorker', 'remoteHauler'], mod.name, flagMem.roomName);
        }
    }
};
mod.handleFlagFound = flag => {
    // Analyze Flag
    if (flag.compareTo(FLAG_COLOR.claim.mining) && Task.nextCreepCheck(flag, mod.name)) {
        Util.set(flag.memory, 'roomName', flag.pos.roomName);
        Util.set(flag.memory, 'task', mod.name);
        // check if a new creep has to be spawned
        Task.mining.checkForRequiredCreeps(flag);
    }
};
// remove creep from task memory of queued creeps
mod.handleSpawningStarted = params => {
    if ( !params.destiny || !params.destiny.task || params.destiny.task != mod.name )
        return;
    const memory = Task.mining.memory(params.destiny.room);
    const flag = Game.flags[params.destiny.targetName];
    if (flag) {
        // validate currently queued entries and clean out spawned creep
        const priority = _.find(Task.mining.creep, {behaviour: params.destiny.type}).queue;
        Task.validateQueued(memory, flag, mod.name, {subKey: params.destiny.type, queues: [priority]});

        if (params.body) params.body = _.countBy(params.body);
        // save spawning creep to task memory
        memory.spawning[params.destiny.type].push(params);
    }
};
mod.handleSpawningCompleted = creep => {
    if ( !creep.data.destiny || !creep.data.destiny.task || creep.data.destiny.task != mod.name )
        return;
    if( creep.data.destiny.homeRoom ) {
        creep.data.homeRoom = creep.data.destiny.homeRoom;
    }
    const flag = Game.flags[creep.data.destiny.targetName];
    if (flag) {
        // calculate & set time required to spawn and send next substitute creep
        // TODO: implement better distance calculation
        creep.data.predictedRenewal = creep.data.spawningTime + (routeRange(creep.data.homeRoom, creep.data.destiny.room)*50);
        // get task memory
        const memory = Task.mining.memory(creep.data.destiny.room);
        // save running creep to task memory
        memory.running[creep.data.destiny.type].push(creep.name);
        // clean/validate task memory spawning creeps
        Task.validateSpawning(memory, flag, mod.name, {roomName: creep.data.destiny.room, subKey: creep.data.destiny.type});
    }
};
// when a creep died (or will die soon)
mod.handleCreepDied = name => {
    // get creep memory
    const mem = Memory.population[name];
    // ensure it is a creep which has been requested by this task (else return)
    if (!mem || !mem.destiny || !mem.destiny.task || mem.destiny.task != mod.name)
        return;
    const flag = Game.flags[mem.destiny.targetName];
    if (flag) {
        // clean/validate task memory running creeps
        const memory = Task.mining.memory(mem.destiny.room);
        Task.validateRunning(memory, flag, mod.name, {subKey: mem.creepType, roomName: mem.destiny.room, deadCreep: name});
    }
};
mod.needsReplacement = (creep) => {
    // this was used below in maxWeight, perhaps it's more accurate?
    // (c.ticksToLive || CREEP_LIFE_TIME) < (50 * travel - 40 + c.data.spawningTime)
    return !creep || (creep.ticksToLive || CREEP_LIFE_TIME) < (creep.data.predictedRenewal || 0);
};
// check if a new creep has to be spawned
mod.checkForRequiredCreeps = (flag) => {
    const roomName = flag.pos.roomName;
    const room = Game.rooms[roomName];
    // Use the roomName as key in Task.memory?
    // Prevents accidentally processing same room multiple times if flags > 1
    const memory = Task.mining.memory(roomName);

    // get number of sources
    let sourceCount;
    // has visibility. get cached property.
    if( room ) sourceCount = room.sources.length;
    // no visibility, but been there before
    else if( Memory.rooms[roomName] && Memory.rooms[roomName].sources ) sourceCount = Memory.rooms[roomName].sources.length;
    // never been there
    else sourceCount = 1;

    const countExisting = type => {
        const priority = _.find(Task.mining.creep, {behaviour: type}).queue;
        Task.validateAll(memory, flag, mod.name, {roomName, subKey: type, queues: [priority], checkValid: true, task: mod.name});
        return memory.queued[type].length + memory.spawning[type].length + memory.running[type].length;
    };
    const haulerCount = countExisting('remoteHauler');
    const minerCount = countExisting('remoteMiner');
    const workerCount = countExisting('remoteWorker');
    // TODO: calculate creeps by type needed per source / mineral

    if( DEBUG && TRACE ) trace('Task', {Task:mod.name, flagName:flag.name, sourceCount, haulerCount, minerCount, workerCount, [mod.name]:'Flag.found'}, 'checking flag@', flag.pos);

    if(mod.strategies.miner.shouldSpawn(minerCount, sourceCount)) {
        if( DEBUG && TRACE ) trace('Task', {Task:mod.name, room:roomName, minerCount,
            minerTTLs: _.map(_.map(memory.running.remoteMiner, n=>Game.creeps[n]), "ticksToLive"), [mod.name]:'minerCount'});
        const miner = mod.strategies.miner.setup(roomName);
        for(let i = minerCount; i < sourceCount; i++) {
            Task.spawn(
                miner, // creepDefinition
                { // destiny
                    task: mod.name, // taskName
                    targetName: flag.name, // targetName
                    type: miner.behaviour // custom
                }, 
                { // spawn room selection params
                    targetRoom: roomName,
                    minEnergyCapacity: miner.minEnergyCapacity, // TODO calculate this
                    rangeRclRatio: 1,
                },
                creepSetup => { // onQueued callback
                    const memory = Task.mining.memory(creepSetup.destiny.room);
                    memory.queued[creepSetup.behaviour].push({
                        room: creepSetup.queueRoom,
                        name: creepSetup.name
                    });
                }
            );
        }
    }

    // only spawn haulers for sources a miner has been spawned for
    const maxHaulers = Math.ceil(memory.running.remoteMiner.length * REMOTE_HAULER.MULTIPLIER);
    if(haulerCount < maxHaulers && (!memory.capacityLastChecked || Game.time - memory.capacityLastChecked > TASK_CREEP_CHECK_INTERVAL)) {
        for(let i = haulerCount; i < maxHaulers; i++) {
            let minWeight = i >= 1 && REMOTE_HAULER.MIN_WEIGHT;
            const spawnRoom = mod.strategies.hauler.spawnRoom(roomName, minWeight);
            if( !spawnRoom ) {
                break;
            }

            // haulers set homeRoom if closer storage exists
            const storageRoom = REMOTE_HAULER.REHOME && mod.strategies.hauler.homeRoom(roomName) || spawnRoom;
            let maxWeight = mod.strategies.hauler.maxWeight(roomName, storageRoom, memory); // TODO Task.strategies
            if( !maxWeight || (!REMOTE_HAULER.ALLOW_OVER_CAPACITY && maxWeight < minWeight)) {
                memory.capacityLastChecked = Game.time;
                break;
            }

            if (_.isNumber(REMOTE_HAULER.ALLOW_OVER_CAPACITY)) {
                maxWeight = Math.max(maxWeight, REMOTE_HAULER.ALLOW_OVER_CAPACITY);
                minWeight = minWeight && Math.min(REMOTE_HAULER.MIN_WEIGHT, maxWeight);
            } else if (REMOTE_HAULER.ALLOW_OVER_CAPACITY) {
                maxWeight = Math.max(maxWeight, REMOTE_HAULER.MIN_WEIGHT);
                minWeight = minWeight && Math.min(REMOTE_HAULER.MIN_WEIGHT, maxWeight);
            }

            // spawning a new hauler
            const creepDefinition = _.create(Task.mining.creep.hauler);
            creepDefinition.maxWeight = maxWeight;
            if (minWeight) creepDefinition.minWeight = minWeight;
            Task.spawn(
                creepDefinition,
                { // destiny
                    task: mod.name, // taskName
                    targetName: flag.name, // targetName
                    type: Task.mining.creep.hauler.behaviour, // custom
                    homeRoom: storageRoom.name
                }, {
                    targetRoom: roomName,
                    explicit: spawnRoom.name,
                },
                creepSetup => { // onQueued callback
                    const memory = Task.mining.memory(creepSetup.destiny.room);
                    memory.queued[creepSetup.behaviour].push({
                        room: creepSetup.queueRoom,
                        name: creepSetup.name,
                        body: _.countBy(creepSetup.parts)
                    });
                }
            );
        }
    }
    if( room && room.myConstructionSites.length > 0 && workerCount < REMOTE_WORKER_MULTIPLIER) {
        for(let i = workerCount; i < REMOTE_WORKER_MULTIPLIER; i++) {
            Task.spawn(
                Task.mining.creep.worker, // creepDefinition
                { // destiny
                    task: mod.name, // taskName
                    targetName: flag.name, // targetName
                    type: Task.mining.creep.worker.behaviour // custom
                }, 
                { // spawn room selection params
                    targetRoom: roomName,
                    minEnergyCapacity: 600
                },
                creepSetup => { // onQueued callback
                    const memory = Task.mining.memory(creepSetup.destiny.room);
                    memory.queued[creepSetup.behaviour].push({
                        room: creepSetup.queueRoom,
                        name: creepSetup.name
                    });
                }
            );
        }
    }
};
mod.findSpawning = (roomName, type) => {
    const spawning = [];
    _.forEach(Game.spawns, s => {
        if (s.spawning && (_.includes(s.spawning.name, type) || (s.newSpawn && _.includes(s.newSpawn.name, type)))) {
            const c = Population.getCreep(s.spawning.name);
            if (c && c.destiny.room === roomName) {
                const params = {
                    spawn: s.name,
                    name: s.spawning.name,
                    destiny: c.destiny
                };
                spawning.push(params);
            }
        }
    });
    return spawning;
};
mod.findRunning = (roomName, type) => {
    const running = [];
    _.forEach(Game.creeps, c => {
        if (!c.spawning && c.data.creepType === type && c.data && c.data.destiny && c.data.destiny.room === roomName) {
            running.push(c.name);
        }
    });
    return running;
};
mod.memory = key => {
    const memory = Task.memory(mod.name, key);
    if( !memory.hasOwnProperty('queued') ){
        memory.queued = {
            remoteMiner:[],
            remoteHauler:[],
            remoteWorker:[]
        };
    }
    if( !memory.hasOwnProperty('spawning') ){
        memory.spawning = {
            remoteMiner: Task.mining.findSpawning(key, 'remoteMiner'),
            remoteHauler: Task.mining.findSpawning(key, 'remoteHauler'),
            remoteWorker: Task.mining.findSpawning(key, 'remoteWorker')
        };
    }
    if( !memory.hasOwnProperty('running') ){
        memory.running = {
            remoteMiner: Task.mining.findRunning(key, 'remoteMiner'),
            remoteHauler: Task.mining.findRunning(key, 'remoteHauler'),
            remoteWorker: Task.mining.findRunning(key, 'remoteWorker')
        };
    }
    if( !memory.hasOwnProperty('nextSpawnCheck') ){
        memory.nextSpawnCheck = {};
    }
    // temporary migration
    if( memory.queued.miner ){
        memory.queued.remoteMiner = memory.queued.miner;
        delete memory.queued.miner;
    }
    if( memory.queued.hauler ){
        memory.queued.remoteHauler = memory.queued.hauler;
        delete memory.queued.hauler;
    }
    if( memory.queued.worker ){
        memory.queued.remoteWorker = memory.queued.worker;
        delete memory.queued.worker;
    }

    return memory;
};
mod.creep = {
    miner: {
        fixedBody: {
            [MOVE]: 1,
            [WORK]: 5,
        },
        multiBody: [MOVE, MOVE, WORK, CARRY],
        maxMulti: 1,
        minEnergyCapacity: 550,
        behaviour: 'remoteMiner',
        queue: 'Medium' // not much point in hauling or working without a miner, and they're a cheap spawn.
    },
    hauler: {
        fixedBody: {
            [CARRY]: 5,
            [MOVE]: 3,
            [WORK]: 1,
        },
        multiBody: [CARRY, CARRY, MOVE],
        behaviour: 'remoteHauler',
        queue: 'Low'
    },
    worker: {
        fixedBody: {
            [CARRY]: 3,
            [MOVE]: 4,
            [WORK]: 4,
        },
        multiBody: {
            [CARRY]: 1,
            [MOVE]: 2,
            [WORK]: 2,
        },
        maxMulti: 3,
        behaviour: 'remoteWorker',
        queue: 'Low'
    }
};
mod.setupCreep = function(roomName, definition) {
    switch (definition.behaviour) {
        default:
            return definition;

        case 'remoteMiner':
            const memory = Task.mining.memory(roomName);
            if (!memory.harvestSize) {
                return definition;
            }

            const isWork = function(b) {
                return b === WORK;
            };
            const baseBody = _.reject(definition.fixedBody, isWork);
            const workParts = _.sum(definition.fixedBody, isWork) + memory.harvestSize;

            return _.create(definition, {
                fixedBody: _.times(workParts, _.constant(WORK))
                    .concat(_.times(Math.ceil(memory.harvestSize * 0.5), _.constant(MOVE)))
                    .concat(baseBody),
                moveBalance: (memory.harvestSize % 2) * -0.5,
            });
    }
};
mod.getFlag = function(roomName) {
    return FlagDir.find(FLAG_COLOR.claim.mining, new RoomPosition(25, 25, roomName));
};
mod.carry = function(roomName, partChange) {
    const memory = Task.mining.memory(roomName);
    memory.carryParts = (memory.carryParts || 0) + (partChange || 0);
    const population = Math.round(mod.carryPopulation(roomName) * 100);
    if (partChange) {
        Task.forceCreepCheck(Task.mining.getFlag(roomName), mod.name);
        delete memory.capacityLastChecked;
    }
    return `Task.${mod.name}: hauler carry capacity for ${roomName} ${memory.carryParts >= 0 ? 'increased' : 'decreased'} by ${Math.abs(memory.carryParts)}. Currently at ${population}% of desired capacity`;
};
mod.harvest = function(roomName, partChange) {
    const memory = Task.mining.memory(roomName);
    memory.harvestSize = (memory.harvestSize || 0) + (partChange || 0);
    return `Task.${mod.name}: harvesting work capacity for ${roomName} ${memory.harvestSize >= 0 ? 'increased' : 'decreased'} by ${Math.abs(memory.harvestSize)} per miner.`;
};
mod.checkCapacity= function(roomName) {
    const checkRoomCapacity = function(roomName, minPopulation, maxDropped) {
        const population = Math.round(mod.carryPopulation(roomName) * 100);
        const room = Game.rooms[roomName];
        const dropped = room ? room.find(FIND_DROPPED_ENERGY): null;
        let message = 'unknown dropped energy, room not visible.';
        let totalDropped = 0;
        if (dropped) {
            totalDropped = _.sum(dropped, d => d.energy);
            message = 'with ' + totalDropped + ' dropped energy.';
        }
        if (population <= minPopulation || totalDropped >= maxDropped) {
            console.log(mod.carry(roomName), message, Util.stack());
            return true;
        }
        return false;
    };
    if (roomName) {
        return checkRoomCapacity(roomName, 100, 0);
    } else {
        let count = 0;
        let total = 0;
        for (const roomName in Memory.tasks.mining) {
            total++;
            if (checkRoomCapacity(roomName, 90, 1000)) count++;
        }
        return `Task.${mod.name} ${count} rooms under-capacity out of ${total}.`;
    }
};
mod.storage = function(miningRoom, storageRoom) {
    const room = Game.rooms[miningRoom];
    const memory = Task.mining.memory(miningRoom);
    if (storageRoom) {
        const was = memory.storageRoom;
        memory.storageRoom = storageRoom;
        return `Task.${mod.name}: room ${miningRoom}, now sending haulers to ${storageRoom}, (was ${was})`;
    } else if (!memory.storageRoom) {
        return `Task.${mod.name}: room ${miningRoom}, no custom storage destination`;
    } else if (storageRoom === false) {
        const was = memory.storageRoom;
        delete memory.storageRoom;
        return `Task.${mod.name}: room ${miningRoom}, cleared custom storage room (was ${was})`;
    } else {
        return `Task.${mod.name}: room ${miningRoom}, sending haulers to ${memory.storageRoom}`;
    }
};
function haulerCarryToWeight(carry) {
    if( !carry || carry < 0) return 0;
    const multiCarry = _.max([0, carry - 5]);
    return 500 + 150 * _.ceil(multiCarry * 0.5);
}
mod.carryPopulation = function(miningRoomName, homeRoom) {
    // how much more do we need to meet our goals
    const neededWeight = Task.mining.strategies.hauler.maxWeight(miningRoomName, homeRoom, undefined, false, true);
    // how much do we need for this room in total
    const totalWeight = Task.mining.strategies.hauler.maxWeight(miningRoomName, homeRoom, undefined, true, true);
    return 1 - neededWeight / totalWeight;
};
mod.strategies = {
    defaultStrategy: {
        name: `default-${mod.name}`,
    },
    reserve: {
        name: `reserve-${mod.name}`,
        spawnParams: function(flag) {
            const population = mod.carryPopulation(flag.pos.roomName);

            if( population < REMOTE_RESERVE_HAUL_CAPACITY ) {
                // TODO if this room & all exits are currently reserved (by anyone) then use default to prevent Invaders?
                if( DEBUG && TRACE ) trace('Task', {flagName:flag.name, pos:flag.pos, population, spawnParams:'population', [mod.name]:'spawnParams', Task:mod.name});
                return {count: 0, priority: 'Low'};
            }

            return Task.reserve.strategies.defaultStrategy.spawnParams(flag);
        }
    },
    miner: {
        name: `miner-${mod.name}`,
        setup: function(roomName) {
            return Task.mining.setupCreep(roomName, Task.mining.creep.miner);
        },
        shouldSpawn: function(minerCount, sourceCount) {
            return minerCount < sourceCount;
        },
    },
    hauler: {
        name: `hauler-${mod.name}`,
        ept: function(roomName) {
            const room = Game.rooms[roomName];
            return room ? 10 * room.sources.length : 20;
        },
        homeRoom: function(flagRoomName) {
            // Explicity set by user?
            const memory = Task.mining.memory(flagRoomName);
            if(memory.storageRoom) return Game.rooms[memory.storageRoom];
            // Otherwise, score it
            return Room.bestSpawnRoomFor(flagRoomName);
        },
        spawnRoom: function(flagRoomName, minWeight) {
            return Room.findSpawnRoom({
                targetRoom: flagRoomName,
                minEnergyCapacity: minWeight || 500,
            });
        },
        maxWeight: function(flagRoomName, homeRoom, memory, ignorePopulation, ignoreQueue) {
            if( !memory ) memory = Task.mining.memory(flagRoomName);
            if( !homeRoom ) homeRoom = mod.strategies.hauler.homeRoom(flagRoomName);
            const existingHaulers = ignorePopulation ? [] : _.map(memory.running.remoteHauler, n=>Game.creeps[n]);
            const queuedHaulers = ignoreQueue ? [] : _.union(memory.queued.remoteHauler, memory.spawning.remoteHauler);
            const room = Game.rooms[flagRoomName];
            // TODO loop per-source, take pinned delivery for route calc
            const travel = routeRange(flagRoomName, homeRoom.name);
            const ept = Task.mining.strategies.hauler.ept(flagRoomName);
            // carry = ept * travel * 2 * 50 / 50
            const validHaulers = _.filter(existingHaulers, c => !Task.mining.needsReplacement(c));
            const existingCarry = _.sum(validHaulers, c => (c && c.data && c.data.body) ? c.data.body.carry : 5);
            const queuedCarry = _.sum(queuedHaulers, c => (c && c.body) ? c.body.carry : 5);
            const neededCarry = ept * travel * 2 + (memory.carryParts || 0) - existingCarry - queuedCarry;
            const maxWeight = haulerCarryToWeight(neededCarry);
            if( DEBUG && TRACE ) trace('Task', {Task:mod.name, room: flagRoomName, homeRoom: homeRoom.name,
                haulers: existingHaulers.length + queuedHaulers.length, ept, travel, existingCarry, queuedCarry,
                neededCarry, maxWeight, [mod.name]:'maxWeight'});
            return maxWeight;
        }
    },
};
