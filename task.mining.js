let mod = {};
module.exports = mod;
mod.minControllerLevel = 2;
mod.name = 'mining';
mod.register = () => {
    // when a new flag has been found (occurs every tick, for each flag)
    Flag.found.on( flag => Task.mining.handleFlagFound(flag) );
    // when a flag has been removed
    Flag.FlagRemoved.on( flagName => Task.mining.handleFlagRemoved(flagName) );
    // a creep starts spawning
    Creep.spawningStarted.on( params => Task.mining.handleSpawningStarted(params) );
    Creep.spawningCompleted.on( creep => Task.mining.handleSpawningCompleted(creep) );
    Creep.died.on( name => Task.mining.handleCreepDied(name));
};
mod.checkFlag = (flag) => {
    if( flag.color == FLAG_COLOR.claim.mining.color && flag.secondaryColor == FLAG_COLOR.claim.mining.secondaryColor ) {
        flag.memory.roomName = flag.pos.roomName;
        flag.memory.task = mod.name;
        return true;
    }
    return false;
};
mod.handleFlagRemoved = flagName => {
    // check flag
    let flagMem = Memory.flags[flagName];
    if( flagMem && flagMem.task === mod.name && flagMem.roomName ){
        // if there is still a mining flag in that room ignore. 
        let flags = FlagDir.filter(FLAG_COLOR.claim.mining, new RoomPosition(25,25,flagMem.roomName), true);
        if( flags && flags.length > 0 ) 
            return;
        else {
            // no more mining in that room. 
            // clear memory
            Task.clearMemory(mod.name, flagMem.roomName);
        }
    }
};
mod.handleFlagFound = flag => {
    // Analyze Flag
    if( Task.mining.checkFlag(flag) ){
        // check if a new creep has to be spawned
        Task.mining.checkForRequiredCreeps(flag);
    }
};
// remove creep from task memory of queued creeps
mod.handleSpawningStarted = params => {
    if ( !params.destiny || !params.destiny.task || params.destiny.task != mod.name )
        return;
    let memory = Task.mining.memory(params.destiny.room);
    if( memory.queued[params.destiny.type] ) memory.queued[params.destiny.type].pop();
    else if( params.destiny.role ) {
        // temporary migration
        if( params.destiny.role == "hauler" ) params.destiny.type = 'remoteHauler';
        else if( params.destiny.role == "miner" ) params.destiny.type = 'remoteMiner';
        else if( params.destiny.role == "worker" ) params.destiny.type = 'remoteWorker';
        memory.queued[params.destiny.type].pop();
    }
    // save spawning creep to task memory
    memory.spawning[params.destiny.type].push(params);
};
mod.handleSpawningCompleted = creep => {
    if ( !creep.data.destiny || !creep.data.destiny.task || creep.data.destiny.task != mod.name )
        return;
    if( creep.data.destiny.homeRoom ) {
        creep.data.homeRoom = creep.data.destiny.homeRoom;
    }
    // calculate & set time required to spawn and send next substitute creep
    // TODO: implement better distance calculation
    creep.data.predictedRenewal = creep.data.spawningTime + (routeRange(creep.data.homeRoom, creep.data.destiny.room)*50);
    // get task memory
    let memory = Task.mining.memory(creep.data.destiny.room);
    // save running creep to task memory
    memory.running[creep.data.destiny.type].push(creep.name);
    // clean/validate task memory spawning creeps
    let spawning = [];
    let validateSpawning = o => {
        let spawn = Game.spawns[o.spawn];
        if( spawn && ((spawn.spawning && spawn.spawning.name == o.name) || (spawn.newSpawn && spawn.newSpawn.name == o.name))) {
            spawning.push(o);
        }
    };
    memory.spawning[creep.data.destiny.type].forEach(validateSpawning);
    memory.spawning[creep.data.destiny.type] = spawning;
};
// when a creep died (or will die soon)
mod.handleCreepDied = name => {
    // get creep memory
    let mem = Memory.population[name];
    // ensure it is a creep which has been requested by this task (else return)
    if (!mem || !mem.destiny || !mem.destiny.task || mem.destiny.task != mod.name)
        return;
    // get task memory
    let memory = Task.mining.memory(mem.destiny.room);
    // clean/validate task memory running creeps
    let running = [];
    let validateRunning = o => {
        // invalidate dead or old creeps for predicted spawning
        let creep = Game.creeps[o];
        if( !creep || !creep.data ) return;
        // invalidate old creeps for predicted spawning
        // TODO: better distance calculation
        let prediction;
        if( creep.data.predictedRenewal ) prediction = creep.data.predictedRenewal;
        else if( creep.data.spawningTime ) prediction = (creep.data.spawningTime + (routeRange(creep.data.homeRoom, flag.pos.roomName)*50));
        else prediction = (routeRange(creep.data.homeRoom, flag.pos.roomName)+1) * 50;
        if( creep.name != name && creep.ticksToLive > prediction ) {
            running.push(o);
        }
    };
    memory.running[mem.creepType].forEach(validateRunning);
    memory.running[mem.creepType] = running;
};
// check if a new creep has to be spawned
mod.checkForRequiredCreeps = (flag) => {
    const roomName = flag.pos.roomName;
    const room = Game.rooms[roomName];
    // Use the roomName as key in Task.memory?
    // Prevents accidentally processing same room multiple times if flags > 1
    let memory = Task.mining.memory(roomName);

    // get number of sources
    let sourceCount;
    // has visibility. get cached property.
    if( room ) sourceCount = room.sources.length;
    // no visibility, but been there before
    else if( Memory.rooms[roomName] && Memory.rooms[roomName].sources ) sourceCount = Memory.rooms[roomName].sources.length;
    // never been there
    else sourceCount = 1;

    let countExisting = type => {
        let running = _.map(memory.running[type], n => Game.creeps[n]);
        let runningCount = _.filter(running, c => (c.ticksToLive || CREEP_LIFE_TIME) > (c.data.predictedRenewal || 0)).length;
        return memory.queued[type].length + memory.spawning[type].length + runningCount;
    };

    // trace didn't like c.remoteMiner
    let haulerCount = countExisting('remoteHauler');
    let minerCount = countExisting('remoteMiner');
    let workerCount = countExisting('remoteWorker');
    // TODO: calculate creeps by type needed per source / mineral

    if( DEBUG && TRACE ) trace('Task', {Task:mod.name, flagName:flag.name, sourceCount, haulerCount, minerCount, workerCount, [mod.name]:'Flag.found'}, 'checking flag@', flag.pos);

    if(minerCount < sourceCount) {
        if( DEBUG && TRACE ) trace('Task', {Task:mod.name, room:flag.pos.roomName, minerCount,
            minerTTLs: _.map(_.map(memory.running.remoteMiner, n=>Game.creeps[n]), "ticksToLive"), [mod.name]:'minerCount'});

        for(let i = minerCount; i < sourceCount; i++) {
            Task.spawn(
                Task.mining.creep.miner, // creepDefinition
                { // destiny
                    task: mod.name, // taskName
                    targetName: flag.name, // targetName
                    type: Task.mining.creep.miner.behaviour // custom
                }, 
                { // spawn room selection params
                    targetRoom: flag.pos.roomName,
                    minEnergyCapacity: 550,
                    rangeRclRatio: 1,
                },
                creepSetup => { // onQueued callback
                    let memory = Task.mining.memory(creepSetup.destiny.room);
                    memory.queued[creepSetup.behaviour].push({
                        room: creepSetup.queueRoom,
                        name: creepSetup.name
                    });
                }
            );
        }
    }

    // only spawn haulers for sources a miner has been spawned for
    let maxHaulers = Math.ceil(memory.running.remoteMiner.length * REMOTE_HAULER_MULTIPLIER);
    if(haulerCount < maxHaulers && (!memory.haulersChecked || haulerCount < memory.haulersChecked)) {
        // don't check for haulers again until one has died, otherwise it loops in maxWeight returning < REMOTE_HAULER_MIN_WEIGHT
        memory.haulersChecked = haulerCount;
        for(let i = haulerCount; i < maxHaulers; i++) {
            const spawnRoom = mod.strategies.hauler.spawnRoom(roomName);
            if( !spawnRoom ) break;

            // haulers set homeRoom if closer storage exists
            const storageRoom = REMOTE_HAULER_REHOME && mod.strategies.hauler.homeRoom(roomName) || spawnRoom;
            const maxWeight = mod.strategies.hauler.maxWeight(roomName, storageRoom, memory); // TODO Task.strategies
            if( !maxWeight || (i >= 1 && maxWeight < REMOTE_HAULER_MIN_WEIGHT)) break;

            const creepDefinition = _.create(Task.mining.creep.hauler);
            creepDefinition.maxWeight = maxWeight;
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
                    let memory = Task.mining.memory(creepSetup.destiny.room);
                    memory.queued[creepSetup.behaviour].push({
                        room: creepSetup.queueRoom,
                        name: creepSetup.name,
                        weight: Creep.bodyCosts(creepSetup.parts),
                    });
                }
            );
        }
    }
    if( room && room.constructionSites.length > 0 && workerCount < REMOTE_WORKER_MULTIPLIER) {
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
                    let memory = Task.mining.memory(creepSetup.destiny.room);
                    memory.queued[creepSetup.behaviour].push({
                        room: creepSetup.queueRoom,
                        name: creepSetup.name
                    });
                }
            );
        }
    }
};
mod.memory = key => {
    let memory = Task.memory(mod.name, key);
    if( !memory.hasOwnProperty('queued') ){
        memory.queued = {
            remoteMiner:[], 
            remoteHauler:[], 
            remoteWorker:[]
        };
    }
    if( !memory.hasOwnProperty('spawning') ){
        memory.spawning = {
            remoteMiner:[], 
            remoteHauler:[], 
            remoteWorker:[]
        };
    }
    if( !memory.hasOwnProperty('running') ){
        memory.running = {
            remoteMiner:[], 
            remoteHauler:[], 
            remoteWorker:[]
        };
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
        fixedBody: [MOVE, WORK, WORK, WORK, WORK, WORK],
        multiBody: [MOVE, MOVE, WORK, CARRY],
        maxMulti: 1,
        behaviour: 'remoteMiner',
        queue: 'Medium' // not much point in hauling or working without a miner, and they're a cheap spawn.
    },
    hauler: {
        fixedBody: [CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, WORK],
        multiBody: [CARRY, CARRY, MOVE],
        behaviour: 'remoteHauler',
        queue: 'Low'
    },
    worker: {
        fixedBody: [MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, WORK, WORK, WORK],
        multiBody: [], 
        behaviour: 'remoteWorker',
        queue: 'Low'
    }
};
mod.carry = function(roomName, partChange) {
    let memory = Task.mining.memory(roomName);
    if (partChange > 0) {
        let maxHaulers = Math.ceil(memory.running.remoteMiner.length * REMOTE_HAULER_MULTIPLIER);
        memory.haulersChecked = maxHaulers;
    }
    memory.carryParts = (memory.carryParts || 0) + (partChange || 0);
    return `Task.${mod.name} overall hauler carry parts for ${roomName} are ${memory.carryParts >= 0 ? 'increased' : 'decreased'} by ${Math.abs(memory.carryParts)}`;
};
function haulerWeightToCarry(weight) {
    if( !weight || weight < 0) return 0;
    const multiWeight = _.max([0, weight - 500]);
    return 5 + 2 * _.floor(multiWeight / 150);
}
function haulerCarryToWeight(carry) {
    if( !carry || carry < 0) return 0;
    const multiCarry = _.max([0, carry - 5]);
    return 500 + 150 * _.ceil(multiCarry * 0.5);
}
mod.strategies = {
    defaultStrategy: {
        name: `default-${mod.name}`,
    },
    hauler: {
        name: `hauler-${mod.name}`,
        homeRoom: function(flagRoomName) {
            return Room.bestSpawnRoomFor(flagRoomName);
        },
        spawnRoom: function(flagRoomName) {
            return Room.findSpawnRoom({
                targetRoom: flagRoomName,
                minEnergyCapacity: 500
            });
        },
        maxWeight: function(roomName, travelRoom, memory) {
            if( !memory ) memory = Task.mining.memory(roomName);
            let existingCreeps = _.map(memory.running.remoteHauler, n=>Game.creeps[n]);
            const queuedCreeps = _.union(memory.queued.remoteHauler, memory.spawning.remoteHauler);
            const room = Game.rooms[roomName];
            // TODO loop per-source, take pinned delivery for route calc
            const travel = routeRange(roomName, travelRoom.name);
            let ept = 10;
            if( room ) {
                ept = 10 * room.sources.length;
            } else if( travel > 3 ) {
                ept = 20; // assume profitable
            }
            // carry = ept * travel * 2 * 50 / 50
            const existingCarry = _.chain(existingCreeps)
                .filter(function(c) {return (c.ticksToLive || CREEP_LIFE_TIME) > (50 * travel - 40 + c.data.spawningTime);})
                .sum(function(c) {return haulerWeightToCarry(c.weight || 500);}).value();
            const queuedCarry = _.sum(queuedCreeps, c=>haulerWeightToCarry(c.weight || 500));
            const neededCarry = ept * travel * 2 + (memory.carryParts || 0) - existingCarry - queuedCarry;
            const maxWeight = haulerCarryToWeight(neededCarry);
            if( DEBUG && TRACE ) trace('Task', {Task:mod.name, room: roomName, travelRoom: travelRoom.name,
                haulers: existingCreeps.length + queuedCreeps.length, ept, travel, existingCarry, queuedCarry,
                neededCarry, maxWeight, [mod.name]:'maxWeight'});
            return maxWeight;
        }
    },
};
