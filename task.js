var mod = {
    // load all task modules
    guard: load("task.guard"),
    defense: load("task.defense"),
    mining: load("task.mining"),
    claim: load("task.claim"),
    reserve: load("task.reserve"),
    pioneer: load("task.pioneer"),
    attackController: load("task.attackController"),

    // register tasks (hook up into events)
    register: function () {
        let tasks = [
            Task.guard, 
            Task.defense,
            Task.claim,
            Task.reserve,
            Task.mining,
            Task.pioneer,
            Task.attackController
        ];
        var loop = task => {
            task.register();
        }
        _.forEach(tasks, loop);
    },
    memory: (task, s) => { // task:  (string) name of the task, s: (string) any selector for that task, could be room name, flag name, enemy name
        if( !Memory.tasks ) Memory.tasks = {};
        if( !Memory.tasks[task] ) Memory.tasks[task] = {};
        if( !Memory.tasks[task][s] ) Memory.tasks[task][s] = {};
        return Memory.tasks[task][s];
    },
    clearMemory: (task, s) => {
        if( Memory.tasks[task] && Memory.tasks[task][s] )
            delete Memory.tasks[task][s];
    }, 
    spawn: (queueName, taskName, targetRoomName, targetName, creepDefinition, destiny, onQueued) => {  
        // get nearest room
        let room = Room.bestSpawnRoomFor(targetRoomName);
        if( Task[taskName].minControllerLevel && room.controller.level < Task[taskName].minControllerLevel ) return;
        // define new creep
        if(!destiny) destiny = {};
        destiny.task = taskName;
        destiny.room = targetRoomName;
        destiny.targetName = targetName;
        let name = `${creepDefinition.name || creepDefinition.behaviour}-${targetName}`;
        let creepSetup = {
            parts: Creep.Setup.compileBody(room, creepDefinition.fixedBody, creepDefinition.multiBody, true),
            name: name,
            behaviour: creepDefinition.behaviour,
            destiny: destiny, 
            queueRoom: room.name
        };
        if( creepSetup.parts.length === 0 ) {
            // creep has no body. 
            global.logSystem(flag.pos.roomName, dye(CRAYON.error, `${taskName} task tried to queue a zero parts body ${creepDefinition.behaviour} creep. Aborted.` ));
            return;
        }
        // queue creep for spawning
        let queue = room['spawnQueue' + queueName] || room.spawnQueueLow;
        queue.push(creepSetup);
        // save queued creep to task memory
        if( onQueued ) onQueued(creepSetup);
    }
};
module.exports = mod;
