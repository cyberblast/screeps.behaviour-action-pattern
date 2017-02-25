let mod = {};
module.exports = mod;
// load task memory & flush caches
mod.flush = function () {
    const tasks = [
        Task.guard,
        Task.defense,
        Task.claim,
        Task.reserve,
        Task.mining,
        Task.pioneer,
        Task.attackController,
        Task.robbing,
        Task.reputation,
    ];
    for (let i = tasks.length - 1; i >= 0; i--) {
        if (tasks[i].flush) {
            tasks[i].flush();
        }
    }
};
// register tasks (hook up into events)
mod.register = function () {
    const tasks = [
        Task.guard,
        Task.defense,
        Task.claim,
        Task.reserve,
        Task.mining,
        Task.pioneer,
        Task.attackController,
        Task.robbing,
        Task.reputation,
        Task.delivery,
    ];
    for (let i = tasks.length - 1; i >= 0; i--) {
        if (tasks[i].register) {
            tasks[i].register();
        }
    }
};
mod.memory = (task, s) => { // task:  (string) name of the task, s: (string) any selector for that task, could be room name, flag name, enemy name
    if( !Memory.tasks ) Memory.tasks = {};
    if( !Memory.tasks[task] ) Memory.tasks[task] = {};
    if( !Memory.tasks[task][s] ) Memory.tasks[task][s] = {};
    return Memory.tasks[task][s];
};
mod.clearMemory = (task, s) => {
    if( Memory.tasks[task] && Memory.tasks[task][s] )
        delete Memory.tasks[task][s];
};
mod.cache = (task, s) => {
    if( !cache[task] ) cache[task] = {};
    if( !cache[task][s] ) cache[task][s] = {};
    return cache[task][s];
};
mod.clearCache = (task, s) => {
    if( cache[task] && cache[task][s] )
        delete cache[task][s];
};
// creepDefinition: { queue, name, behaviour, fixedBody, multiBody }
// destiny: { task, targetName }
// roomParams: { targetRoom, minRCL = 0, maxRange = Infinity, minEnergyAvailable = 0, minEnergyCapacity = 0, callBack = null, allowTargetRoom = false, rangeRclRatio = 3, rangeQueueRatio = 51 }
mod.spawn = (creepDefinition, destiny, roomParams, onQueued) => {
    // get nearest room
    let room = roomParams.explicit ? Game.rooms[roomParams.explicit] : Room.findSpawnRoom(roomParams);
    if( !room ) return null;
    // define new creep
    if(!destiny) destiny = {};
    if(!destiny.room && roomParams.targetRoom) destiny.room = roomParams.targetRoom;

    let parts = Creep.compileBody(room, creepDefinition);

    let name = `${creepDefinition.name || creepDefinition.behaviour}-${destiny.targetName}`;
    let creepSetup = {
        parts: parts,
        name: name,
        behaviour: creepDefinition.behaviour,
        destiny: destiny,
        queueRoom: room.name
    };
    if( creepSetup.parts.length === 0 ) {
        // creep has no body. 
        global.logSystem(flag.pos.roomName, dye(CRAYON.error, `${destiny.task} task tried to queue a zero parts body ${creepDefinition.behaviour} creep. Aborted.` ));
        return null;
    }
    // queue creep for spawning
    let queue = room['spawnQueue' + creepDefinition.queue] || room.spawnQueueLow;
    queue.push(creepSetup);
    // save queued creep to task memory
    if( onQueued ) onQueued(creepSetup);
    return creepSetup;
};
mod.handleCreepDied = function(task) {
    return function(creepName) {
        const entry = Population.getCreep(creepName);
        if( !(entry && entry.destiny && entry.destiny.task === task.name) ) {
            return;
        }
        const memoryKey = task.memoryKey(entry);
        if (memoryKey) {
            const running = task.memory(memoryKey).running;
            const index = _.indexOf(running, creepName);
            running.splice(index, 1);
        }
    }
};
mod.validateMemoryQueued = function(task, memory) {
    // clean/validate task memory queued creeps
    let queued = [];
    let invalid = [];
    let validateQueued = entry => {
        let room = Game.rooms[entry.room];
        if( (room.spawnQueueMedium.some( c => c.name == entry.name)) || (room.spawnQueueLow.some( c => c.name == entry.name)) ){
            queued.push(entry);
        } else {
            invalid.push(entry);
        }
    };
    memory.queued.forEach(validateQueued);
    if (memory.queued.length !== queued.length) {
        logError('Creep queued list contained invalid entries', {taskName: task.name});
    }
    memory.queued = queued;
};
mod.validateMemorySpawning = function(task, memory) {
    // clean/validate task memory spawning creeps
    let spawning = [];
    let invalid = [];
    let validateSpawning = entry => {
        let spawn = Game.spawns[entry.spawn];
        if( spawn && ((spawn.spawning && spawn.spawning.name == entry.name) || (spawn.newSpawn && spawn.newSpawn.name == entry.name))) {
            spawning.push(entry);
        } else {
            invalid.push(entry);
        }
    };
    memory.spawning.forEach(validateSpawning);
    if (memory.spawning.length !== spawning.length) {
        logError('Creep spawning list contained invalid entries', {taskName: task.name});
    }
    memory.spawning = spawning;
};
mod.validateMemoryRunning = function(task, memory, isValidCallback = (creep => true)) {
    // clean/validate task memory running creeps
    let running = [];
    let invalid = [];
    let validateRunning = entry => {
        let creep = Game.creeps[entry];
        if( !creep || !creep.data ) return;
        if( isValidCallback(creep) ) {
            running.push(entry);
        } else {
            invalid.push(entry);
        }
    };
    memory.running.forEach(validateRunning);
    if (memory.running.length !== running.length) {
        logError('Creep running list contained invalid entries', {taskName: task.name});
    }
    memory.running = running;
};
const cache = {};
