const Task = class {
    constructor(...args) {
        Task.prototype.constructor.apply(this, args);
    }
};
module.exports = Task;

const cache = {};

Task.extend = function() {
    Object.defineProperties(Task, {
        tasks: {
            configurable: true,
            value: [],
        },
        installTask: {
            value: function(...taskNames) {
                taskNames.forEach(taskName => {
                    Task[taskName] = load(`task.${taskName}`);
                    new Task(Task[taskName]);
                });
            },
        },
        memory: {
            configurable: true,
            value: function(task, s) {
                if (!Memory.tasks) Memory.tasks = {};
                if (!Memory.tasks[task]) Memory.tasks[task] = {};
                if (!Memory.tasks[task][s]) Memory.tasks[task][s] = {};
                return Memory.tasks[task][s];
            },
        },
        clearMemory: {
            configurable: true,
            value: function(task, s) {
                if (Memory.tasks[task] && Memory.tasks[task][s]) delete Memory.tasks[task][s];
            },
        },
        cache: {
            configurable: true,
            value: function(task, s) {
                if (!cache[task]) cache[task] = {};
                if (!cache[task][s]) cache[task][s] = {};
                return cache[task][s];
            },
        },
        clearCache: {
            configurable: true,
            value: function(task, s) {
                if (cache[task] && cache[task][s]) delete cache[task][s];
            },
        },
        spawn: {
            configurable: true,
            value: function(creepDefinition, destiny, roomParams, onQueued) {
                // define nearest room
                const room = roomParams.explicit ? Game.rooms[roomParams.explicit] : Room.findSpawnRoom(roomParams);
                if (!room) return null;
                // define new creep
                if (!destiny) destiny = {};
                if (!destiny.room && roomParams.targetRoom) destiny.room = roomParams.targetRoom;
                
                const parts = Creep.compileBody(room, creepDefinition);
                
                const name = `${creepDefinition.name || creepDefinition.behaviour}-${destiny.targetName}`;
                const creepSetup = {
                    parts, name, destiny,
                    behaviour: creepDefinition.behaviour,
                    queueRoom: room.name,
                };
                if (creepSetup.parts.length === 0) {
                    // creep has no body
                    global.logSystem(flag.pos.roomName, dye(CRAYON.error, `${destiny.task} task tried to queue a zero parts body ${creepDefinition.behaviour} creep. Aborted.`));
                    return null;
                }
                // queue creep for spawning
                const queue = room['spawnQueue' + creepDefinition.queue] || room.spawnQueueLow;
                queue.push(creepSetup);
                // save queued creep to task memory
                if (onQueued) onQueued(creepSetup);
                return creepSetup;
            },
        },
    });
    
    Task.prototype.constructor = function(task) {
        if (!(task instanceof Task)) Task.installTask(task);
        Task.tasks.push(task);
    }
};
// load task memory & flush caches
Task.flush = function () {
    Task.tasks.forEach(task => {
        if (task.flush) task.flush();
    });
};
// temporary hack to avoid registering twice internally, remove and fix internal when merged.
mod.selfRegister = true;
// register tasks (hook up into events)
Task.register = function () {
    Task.tasks.forEach(task => {
        // Extending of any other kind
        if (task.register) task.register();
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
