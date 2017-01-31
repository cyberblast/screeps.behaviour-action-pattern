let mod = {};
module.exports = mod;
mod.minControllerLevel = 4;
mod.name = 'mining';
mod.register = () => {
    // when a new flag has been found (occurs every tick, for each flag)
    Flag.found.on( flag => Task.mining.handleFlagFound(flag) );
    // when a flag has been removed
    Flag.FlagRemoved.on( flagName => Task.mining.handleFlagRemoved(flagName) );
    // a creep starts spawning
    Creep.spawningStarted.on( params => Task.mining.handleSpawningStarted(params) );
    Creep.spawningCompleted.on( creep => Task.mining.handleSpawningCompleted(creep) );
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
};
mod.handleSpawningCompleted = creep => {
    if ( !creep.data.destiny || !creep.data.destiny.task || creep.data.destiny.task != mod.name )
        return;

    if( creep.data.destiny.homeRoom ) {
        creep.data.homeRoom = creep.data.destiny.homeRoom;
    }
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
    else if( Memory.rooms[roomName] && Memory.rooms[roomName].sources ) sourceCount = Memory.rooms[roomName].sources.length
    // never been there
    else sourceCount = 1;

    // TODO: don't iterate/filter all creeps (3 times) each tick. store numbers into memory (see guard tasks)
    const creepsByType = _.chain(Game.creeps)
        .filter(function(c) {return c.data.destiny && c.data.destiny.room===roomName;})
        .groupBy('data.creepType').value();
    let existingHaulers = creepsByType.remoteHauler || [];
    let haulerCount = memory.queued.remoteHauler.length + existingHaulers.length;
    let existingMiners = creepsByType.remoteMiner || [];
    let minerCount = memory.queued.remoteMiner.length +
        _.sum(existingMiners, function(c) {return (c.ticksToLive || CREEP_LIFE_TIME) > (c.data.predictedRenewal || 0)});
    let workerCount = memory.queued.remoteWorker.length + (creepsByType.remoteWorker || []).length;
    // TODO: calculate creeps by type needed per source / mineral

    if( DEBUG && TRACE ) trace('Task', {Task:mod.name, flagName:flag.name, sourceCount, haulerCount, minerCount, workerCount, [mod.name]:'Flag.found'}, 'checking flag@', flag.pos);

    if(minerCount < sourceCount) {
        if( DEBUG && TRACE ) trace('Task', {Task:mod.name, room:flag.pos.roomName, minerCount,
            minerTTLs: _.map(existingMiners, "ticksToLive"), [mod.name]:'minerCount'});

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
                    minEnergyCapacity: 800
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
    let runningMiners = _.filter(existingMiners, creep => creep.spawning === false);
    let maxHaulers = Math.ceil(runningMiners.length * REMOTE_HAULER_MULTIPLIER);
    if(haulerCount < maxHaulers) {
        for(let i = haulerCount; i < maxHaulers; i++) {
            const spawnRoom = mod.strategies.hauler.spawnRoom(roomName);

            if( !spawnRoom ) break;

            // haulers set homeRoom if closer storage exists
            const storageRoom = REMOTE_HAULER_REHOME ? mod.strategies.hauler.homeRoom(roomName) : spawnRoom;

            const maxWeight = mod.strategies.hauler.maxWeight(
                roomName, storageRoom, existingHaulers, memory); // TODO Task.strategies

            if( !maxWeight || (i > 1 && maxWeight < REMOTE_HAULER_MIN_WEIGHT)) break;

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
        fixedBody: [MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK, WORK, CARRY],
        multiBody: [],
        behaviour: 'remoteMiner',
        queue: 'Low'
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
    memory.carryParts = (memory.carryParts || 0) + (partChange || 0);
    return `Task.${mod.name} set hauler carry parts for ${roomName} to ${memory.carryParts}`;
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
            return Room.findSpawnRoom({
                targetRoom: flagRoomName,
                minRCL: 4,
                callBack: function(r){return r.storage},
                rangeRclRatio: Infinity,
                rangeQueueRatio: Infinity,
            });
        },
        spawnRoom: function(flagRoomName) {
            return Room.findSpawnRoom({
                targetRoom: flagRoomName,
                minEnergyCapacity: 500
            });
        },
        maxWeight: function(roomName, travelRoom, existingCreeps, memory) {
            if( !memory ) memory = Task.mining.memory(roomName);
            if( !existingCreeps ) existingCreeps = [];
            const queuedCreeps = memory.queued.remoteHauler;
            const room = Game.rooms[roomName];
            const travel = routeRange(roomName, travelRoom.name);
            let ept = 10;
            if( room ) {
                ept = 10 * room.sources.length;
            } else if( travel > 3 ) {
                ept = 20; // assume profitable
            }
            // carry = ept * travel * 2 * 50 / 50
            const existingCarry = _.chain(existingCreeps)
                .filter(function(c) {return (c.ticksToLive || CREEP_LIFE_TIME) > (50 * travel - 40 + c.data.spawningTime)})
                .sum(function(c) {return haulerWeightToCarry(c.data.weight || 500)}).value();
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
