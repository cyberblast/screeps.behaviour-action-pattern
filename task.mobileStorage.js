const mod = {};
module.exports = mod;

mod.register = () => {
    Flag.found.on(Task.mobileStorage.handleFlagFound);
    
    Creep.spawningStarted.on(Task.mobileStorage.handleSpawningStarted);
    
    Creep.spawningCompleted.on(Task.mobileStorage.handleSpawningCompleted);
    
    Creep.predictedRenewal.on(creep => Task.mobileStorage.handleCreepDied(creep.name));
    
    Creep.died.on(Task.mobileStorage.handleCreepDied);
};

mod.handleFlagFound = flag => {
    if (flag.color === FLAG_COLOR.economy.color && flag.secondaryColor === FLAG_COLOR.economy.secondaryColor) {
        Task.mobileStorage.checks(flag);
    }
};

mod.checks = flag => {
    if (!flag || !flag.room) return;
    
    const memory = Task.mobileStorage.memory(flag);
    
    const count = memory.queued.length + memory.spawning.length + memory.running.length;
    
    if (count < 1) {
        Task.spawn(
            Task.mobileStorage.creep,
            {
                task: 'mobileStorage',
                targetName: flag.name,
                flagName: flag.name,
            },
            {
                targetRoom: flag.pos.roomName,
                minEnergyCapacity: 1050,
                rangeRclRatio: 2,
            },
            creepSetup => {
                const memory = Task.mobileStorage.memory(Game.flags[creepSetup.destiny.targetName]);
                memory.queued.push({
                    room: creepSetup.queueRoom,
                    name: creepSetup.name,
                    targetName: flag.name,
                });
            }
        );
    }
};

mod.handleSpawningStarted = params => {
    if (!params.destiny || !params.destiny.task || params.destiny.task !== 'mobileStorage') return;
    
    const flag = Game.flags[params.destiny.flagName];
    if (flag) {
        const memory = Task.mobileStorage.memory.flag(flag);
        memory.spawning.push(params);
        const queued = [];
        const validateQueued = o => {
            const room = Game.rooms[o.room];
            if (room.spawnQueueLow.some(c => c.name === o.name)) {
                queued.push(o);
            }
        };
        memory.queued.forEach(validateQueued);
        memory.queued = queued;
    }
};

mod.handleSpawningCompleted = creep => {
    if (!creep.data || !creep.data.destiny || !creep.data.destiny.task || creep.data.destiny.task !== 'mobileStorage') return;
    
    const flag = Game.flags[creep.data.destiny.flagName];
    if (flag) {
        creep.data.predictedRenewal = creep.data.spawningTime + routeRange(creep.data.homeRoom, flag.pos.roomName) * 50;
        
        const memory = Task.mobileStorage.memory(flag);
        memory.running.push(creep.name);
        
        const spawning = [];
        const validateSpawning = o => {
            const spawn = Game.spawns[o.spawn];
            if (spawn && (spawn.spawning && spawn.spawning.name === o.name || spawn.newSpawn && spawn.newSpawn.name === o.name)) {
                spawning.push(o);
            }
        };
        memory.spawning.forEach(validateSpawning);
        memory.spawning = spawning;
    }
};

mod.handleCreepDied = name => {
    const mem = Memory.population[name];
    if (!mem || !mem.destiny || !mem.destiny.task || mem.destiny.task !== 'mobileStorage') return;
    
    const flag = Game.flags[mem.destiny.flagName];
    if (flag) {
        const memory = Task.mobileStorage.memory(flag);
        const running = [];
        const validateRunning = o => {
            const creep = Game.creeps[o];
            if (!creep || !creep.data) return;
            let prediction;
            if (creep.data.predictedRenewal) {
                prediction = creep.data.predictedRenewal;
            } else if (creep.data.spawningTime) {
                prediction = creep.data.spawningtime + (routeRange(creep.data.homeRoom, flag.pos.roomName) * 50);
            } else {
                prediction = (routeRange(creep.data.homeRoom, flag.pos.roomName) + 1) * 50;
            }
            if (creep.name !== name && creep.ticksToLive > prediction) {
                running.push(o);
            }
        };
        memory.running.forEach(validateRunning);
        memory.running = running;
    }
};

mod.memory = flag => {
    if (!flag.memory.tasks) flag.memory.tasks = {};
    if (!flag.memory.tasks.mobileStorage) {
        flag.memory.tasks.mobileStorage = {
            queued: [],
            spawning: [],
            running: [],
        };
    }
    return flag.memory.tasks.mobileStorage;
};

mod.creep = {
    fixedBody: [CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE],
    multiBody: [CARRY,CARRY,MOVE],
    name: 'mobileStorage',
    behaviour: 'mobileStorage',
    queue: 'Low',
};