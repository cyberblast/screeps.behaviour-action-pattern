let mod = {};
module.exports = mod;
mod.tasks = [];
mod.populate = function() {
    Task.addTasks(...[
        Task.attackController,
        Task.claim,
        Task.defense,
        Task.guard,
        Task.mining,
        Task.pioneer,
        Task.reputation,
        Task.reserve,
        Task.robbing,
    ]);
};
mod.addTasks = (...task) => Task.tasks.push(...task);

mod.installTask = (...taskNames) => {
    taskNames.forEach(taskName => {
        Task[taskName] = load(`task.${taskName}`);
        Task.addTasks(Task[taskName]);
    });
};
// load task memory & flush caches
mod.flush = function () {
    Task.tasks.forEach(task => {
        Util.callIfExists(task.flush);
    });
};
// temporary hack to avoid registering twice internally, remove and fix internal when merged.
mod.selfRegister = true;
// register tasks (hook up into events)
mod.register = function () {
    Task.tasks.forEach(task => {
        // Extending of any other kind
        Util.callIfExists(task.register);
        // Flag Events
        if (task.handleFlagFound) Flag.found.on(flag => task.handleFlagFound(flag));
        if (task.handleFlagRemoved) Flag.FlagRemoved.on(flagName => task.handleFlagRemoved(flagName));
        // Creep Events
        if (task.handleSpawningStarted) Creep.spawningStarted.on(params => task.handleSpawningStarted(params));
        if (task.handleSpawningCompleted) Creep.spawningCompleted.on(creep => task.handleSpawningCompleted(creep));
        if (task.handleCreepDied) {
            Creep.predictedRenewal.on(creep => task.handleCreepDied(creep.name));
            Creep.died.on(name => task.handleCreepDied(name));
        }
        if (task.handleCreepError) Creep.error.on(errorData => task.handleCreepError(errorData));
        // Room events
        if (task.handleNewInvader) Room.newInvader.on(invader => task.handleNewInvader(invader));
        if (task.handleKnownInvader) Room.knownInvader.on(invaderID => task.handleKnownInvader(invaderID));
        if (task.handleGoneInvader) Room.goneInvader.on(invaderID => task.handleGoneInvader(invaderID));
        if (task.handleRoomDied) Room.collapsed.on(room => task.handleRoomDied(room));
    });
};
mod.memory = (task, s) => { // task:  (string) name of the task, s: (string) any selector for that task, could be room name, flag name, enemy name
    return Util.get(Memory, `tasks.${task}.${s}`, {});
};
mod.clearMemory = (task, s) => {
    if( Memory.tasks[task] && Memory.tasks[task][s] )
        delete Memory.tasks[task][s];
};
mod.cache = (task, s) => {
    return Util.get(cache, `task.${task}.${s}`, {});
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
const cache = {};
