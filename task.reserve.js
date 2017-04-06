// This task will react on exploit, reserve and remotemine flags, sending a reserving creep to the flags position.
let mod = {};
module.exports = mod;
mod.name = 'reserve';
mod.creep = {
    reserver: {
        fixedBody: [CLAIM, CLAIM, MOVE, MOVE],
        multiBody: [CLAIM, MOVE],
        maxMulti: 7,
        name: "reserver", 
        behaviour: "claimer"
    },
};
// hook into events
mod.register = () => {
    // when a new flag has been found (occurs every tick, for each flag)
    Flag.found.on( flag => Task.reserve.handleFlagFound(flag) );
    // a creep starts spawning
    Creep.spawningStarted.on( params => Task.reserve.handleSpawningStarted(params) );
    // a creep completed spawning
    Creep.spawningCompleted.on( creep => Task.reserve.handleSpawningCompleted(creep) );
    // a creep will die soon
    Creep.predictedRenewal.on( creep => Task.reserve.handleCreepDied(creep.name) );
    // a creep died
    Creep.died.on( name => Task.reserve.handleCreepDied(name) );
};
// for each flag
mod.handleFlagFound = flag => {
    // if it is a reserve, exploit or remote mine flag
    if( flag.color == FLAG_COLOR.claim.reserve.color && flag.secondaryColor == FLAG_COLOR.claim.reserve.secondaryColor ||
        flag.color == FLAG_COLOR.invade.exploit.color && flag.secondaryColor == FLAG_COLOR.invade.exploit.secondaryColor ||
        flag.color == FLAG_COLOR.claim.mining.color && flag.secondaryColor == FLAG_COLOR.claim.mining.secondaryColor){
        // check if a new creep has to be spawned
        Task.reserve.checkForRequiredCreeps(flag);
    }
};
// check if a new creep has to be spawned
mod.checkForRequiredCreeps = (flag) => {
    let spawnParams;
    if( flag.color == FLAG_COLOR.claim.mining.color && flag.secondaryColor == FLAG_COLOR.claim.mining.secondaryColor ) {
        spawnParams = Task.mining.strategies.reserve.spawnParams(flag);
    } else {
        spawnParams = mod.strategies.defaultStrategy.spawnParams(flag);
    }

    // get task memory
    let memory = Task.reserve.memory(flag);

    // if low & creep in low queue => move to medium queue
    if( spawnParams.queue !== 'Low' && memory.queued.length == 1 ) {
        let spawnRoom = Game.rooms[memory.queued[0].room];
        let elevate = (entry, index) => {
            if( entry.targetName == memory.queued[0].targetName ){
                let spawnData = spawnRoom.spawnQueueLow.splice(index, 1);
                spawnRoom.spawnQueueMedium.push(spawnData);
                return true;
            }
            return false;
        };
        spawnRoom.spawnQueueLow.find(elevate);
    }

    // count creeps assigned to task
    let count = memory.queued.length + memory.spawning.length + memory.running.length;

    // if creep count below requirement spawn a new creep creep
    if( count < spawnParams.count ) {
        Task.reserve.creep.reserver.queue = spawnParams.queue;
        Task.spawn(
            Task.reserve.creep.reserver, // creepDefinition
            { // destiny
                task: mod.name, // taskName
                targetName: flag.name, // targetName
            }, 
            { // spawn room selection params
                targetRoom: flag.pos.roomName, 
                minEnergyCapacity: 1300
            },
            creepSetup => { // callback onQueued
                let memory = Task.reserve.memory(Game.flags[creepSetup.destiny.targetName]);
                memory.queued.push({
                    room: creepSetup.queueRoom,
                    name: creepSetup.name, 
                    targetName: flag.name
                });
            }
        );
    }
};
// when a creep starts spawning
mod.handleSpawningStarted = params => { // params: {spawn: spawn.name, name: creep.name, destiny: creep.destiny}
    // ensure it is a creep which has been queued by this task (else return)    
    if ( !params.destiny || !params.destiny.task || params.destiny.task != mod.name )
        return;
    // get flag which caused queueing of that creep
    let flag = Game.flags[params.destiny.targetName];
    if (flag) {
        // get task memory
        let memory = Task.reserve.memory(flag);
        // clean/validate task memory queued creeps
        if( memory.valid != Game.time ) Task.reserve.validateMemoryQueued(memory);
        // save spawning creep to task memory
        memory.spawning.push(params);
    }
};
// when a creep completed spawning
mod.handleSpawningCompleted = creep => {
    // ensure it is a creep which has been requested by this task (else return)
    if (!creep.data || !creep.data.destiny || !creep.data.destiny.task || creep.data.destiny.task != mod.name)
        return;
    // get flag which caused request of that creep
    let flag = Game.flags[creep.data.destiny.targetName];
    if (flag) {
        // calculate & set time required to spawn and send next substitute creep
        // TODO: implement better distance calculation
        creep.data.predictedRenewal = creep.data.spawningTime + (routeRange(creep.data.homeRoom, flag.pos.roomName)*50);
        // get task memory
        let memory = Task.reserve.memory(flag);
        // clean/validate task memory spawning creeps
        if( memory.valid != Game.time ) Task.reserve.validateMemorySpawning(memory);
        // save running creep to task memory
        memory.running.push(creep.name);
    }
};
// when a creep died (or will die soon)
mod.handleCreepDied = name => {
    // get creep memory
    // console.log('task.reserve.handleCreepDied(' + name + ")" );
    let mem = Memory.population[name];
    // ensure it is a creep which has been requested by this task (else return)
    if (!mem || !mem.destiny || !mem.destiny.task || mem.destiny.task != mod.name)
        return;
    // get flag which caused request of that creep
    let flag = Game.flags[mem.destiny.targetName];
    if (flag) {
        // get task memory
        let memory = Task.reserve.memory(flag);
        // clean/validate task memory running creeps
        if( memory.valid != Game.time ) Task.reserve.validateMemoryRunning(memory);
    }
};
mod.nextAction = creep => {
    // override behaviours nextAction function
    // this could be a global approach to manipulate creep behaviour

    //Reserve if possible, if not (should be never) then recycle
    let priority = [
        Creep.action.reserving,
        Creep.action.recycling
    ];
    //  console.log("bingo")
    for(var iAction = 0; iAction < priority.length; iAction++) {
        var action = priority[iAction];
        if(action.isValidAction(creep) &&
            action.isAddableAction(creep) &&
            action.assign(creep)) {
                break;
        }
    }
    if( DEBUG && TRACE ) trace('Task', {creepName:creep.name, nextAction:creep.action.name, [mod.name]: 'nextAction', Task:mod.name});
};
// get task memory
mod.memory = (flag) => {
    if( !flag.memory.tasks ) 
        flag.memory.tasks = {};
    if( !flag.memory.tasks.reserve ) {
        flag.memory.tasks.reserve = {
            valid: Game.time,
            queued: [], 
            spawning: [],
            running: []
        }
    }
    let memory = flag.memory.tasks.reserve;
    if( !memory.valid || memory.valid < ( Game.time - MEMORY_RESYNC_INTERVAL ) )
        Task.reserve.validateMemory(memory);
    return memory;
};
mod.validateMemoryQueued = memory => {
    // clean/validate task memory queued creeps
    let queued = []
    let validateQueued = entry => {
        let room = Game.rooms[entry.room];
        if( (room.spawnQueueMedium.some( c => c.name == entry.name)) || (room.spawnQueueLow.some( c => c.name == entry.name)) ){
            queued.push(entry);
        }
    };
    memory.queued.forEach(validateQueued);
    memory.queued = queued;
};
mod.validateMemorySpawning = memory => {
    // clean/validate task memory spawning creeps
    let spawning = []
    let validateSpawning = entry => {
        let spawn = Game.spawns[entry.spawn];
        if( spawn && ((spawn.spawning && spawn.spawning.name == entry.name) || (spawn.newSpawn && spawn.newSpawn.name == entry.name))) {
            spawning.push(entry);
        }
    };
    memory.spawning.forEach(validateSpawning);
    memory.spawning = spawning;
};
mod.validateMemoryRunning = memory => {
    // clean/validate task memory running creeps
    let running = []
    let validateRunning = entry => {
        // invalidate dead or old creeps for predicted spawning
        let creep = Game.creeps[entry];
        if( !creep || !creep.data ) return;
        // TODO: better distance calculation
        let prediction;
        if( creep.data.predictedRenewal ) prediction = creep.data.predictedRenewal;
        else if( creep.data.spawningTime ) prediction = (creep.data.spawningTime + (routeRange(creep.data.homeRoom, flag.pos.roomName)*50));
        else prediction = (routeRange(creep.data.homeRoom, flag.pos.roomName) + 1) * 50;
        if( creep.ticksToLive > prediction ) {
            running.push(entry);
        }
    };
    memory.running.forEach(validateRunning);
    memory.running = running;
};
mod.validateMemory = memory => {
    Task.reserve.validateMemoryQueued(memory);
    Task.reserve.validateMemorySpawning(memory);
    Task.reserve.validateMemoryRunning(memory);
    memory.valid = Game.time;
};
mod.strategies = {
    defaultStrategy: {
        name: `default-${mod.name}`,
        spawnParams: function(flag) { //:{count:number, priority:string}
            let count = 1;

            const myName = _.find(Game.spawns).owner.username;
            // Don't spawn if...
            const hasFlag = !!flag;
            const hasController = Room.isControllerRoom(flag.pos.roomName) || (flag.room && flag.room.controller);
            const hasReservation = (flag.room && flag.room.controller && flag.room.controller.reservation && (flag.room.controller.reservation.ticksToEnd > 1000 || flag.room.controller.reservation.username != myName) );
            const isOwned = (flag.room && flag.room.controller && flag.room.controller.owner);
            if( // Flag was removed
                !hasFlag ||
                // No controller in room
                !hasController ||
                // My reservation is already sufficiently high or reserved by another player
                hasReservation ||
                // Room is owned
                isOwned ) {
                if( DEBUG && TRACE ) trace('Task', {hasFlag, hasController, hasReservation, isOwned, checkForRequiredCreeps:'skipping room', [mod.name]:'checkForRequiredCreeps', Task:mod.name});
                count = 0;
            }

            // check reservation level
            let lowReservation = (count > 0 && flag.room &&
                ((flag.room.controller && !flag.room.controller.reservation) ||
                (flag.room.controller && flag.room.controller.reservation && flag.room.controller.reservation.ticksToEnd < 250)));

            const queue = lowReservation ? 'Medium' : 'Low';

            return {count, queue};
        },
    },
}