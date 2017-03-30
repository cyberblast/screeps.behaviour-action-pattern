const Task = class {
    constructor(...args) { // Allows constructor to be extended
        Task.prototype.constructor.apply(this, args);
    }
};
module.exports = Task;

const cache = {};

Task.extend = function() {
    // STATIC
    Object.defineProperties(Task, {
        tasks: {
            configurable: true,
            value: [
                Task.attackController,
                Task.claim,
                Task.defense,
                Task.guard,
                Task.mining,
                Task.pioneer,
                Task.reputation,
                Task.reserve,
                Task.robbing,
            ],
        },
        installTask: {
            value: function(...taskNames) {
                taskNames.forEach(taskName => {
                    Task[taskName] = Task[taskName] || load(`task.${taskName}`);
                    new Task(Task[taskName]);
                });
            },
        },
        memory: {
            configurable: true,
            value: function(task, s) {
                return Util.get(Memory, `tasks.${task}.${s}`, {});
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
                return Util.get(cache, `${task}.${s}`, {});
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
    
    // INSTANCE
    Task.prototype.constructor = function(task) {
        if (task.link) {            // not a task
            Task.installTask(task); // install the task
            return;                 // and return
        }
        Task.tasks.push(task);
    };
    
    Task.prototype.register = function() {
        if (this.handleFlagFound) Flag.found.on(flag => this.handleFlagFound(flag));
        if (this.handleFlagRemoved) Flag.FlagRemoved.on(flagName => this.handleFlagRemoved(flagName));
        
        if (this.handleSpawningStarted) Creep.spawningStarted.on(params => this.handleSpawningStarted(params));
        if (this.handleSpawningCompleted) Creep.spawningCompleted.on(creep => this.handleSpawningCompleted(creep));
        if (this.handleCreepDied) {
            Creep.predictedRenewal.on(creep => this.handleCreepDied(creep.name));
            Creep.died.on(name => this.handleCreepDied(name));
        }
        if (this.handleCreepError) Creep.error.on(errorData => this.handleCreepError(errorData));
        
        if (this.handleNewInvader) Room.newInvader.on(invader => this.handleNewInvader(invader));
        if (this.handleKnownInvader) Room.knownInvader.on(invaderID => this.handleKnownInvader(invaderID));
        if (this.handleGoneInvader) Room.goneInvader.on(invaderID => this.handleGoneInvader(invaderID));
        if (this.handleRoomDied) Room.collapsed.on(room => this.handleRoomDied(room));
    };
    
    Task.prototype.handleFlagRemoved = function(flagName) {
        const flagMem = Memory.flags[flagName];
        if (flagMem && flagMem.task === this.name && flagMem.roomName) {
            const flags = FlagDir.filter(FLAG_COLOR.claim.mining, new RoomPosition(25, 25, flagMem.roomName), true);
            if (!(flags && flags.length > 0)) {
                Task.clearMemory(this.name, flagMem.roomName);
            }
        }
    };
};
// load task memory & flush caches
Task.flush = function () {
    Task.tasks.forEach(task => {
        if (task.flush) task.flush();
    });
};
// register tasks (hook up into events)
Task.register = function () {
    Task.tasks.forEach(task => {
        task.register();
    });
};
