// This task will react on pioneer flags - 4 for Green/White, 1 for Green/Red
let mod = {};
module.exports = mod;
mod.name = 'pioneer';
// hook into events
mod.register = () => {};
mod.handleRoomDied = room => {
    const recoveryType = 'collapseWorker';

    if (room.population && room.population.typeCount[recoveryType]) {
        return;
    }

    // try to spawn a worker
    let pioneer = true;
    if( room.energyAvailable > 199 ) {
        // flush high queue
        room.spawnQueueHigh.splice(0, room.spawnQueueHigh.length);
        const definition = Task.pioneer.creep.worker;
        pioneer = !Task.spawn(
            definition, // creepDefinition
            { // destiny
                task: recoveryType, // taskName
                targetName: room.name, // targetName
                type: definition.behaviour,
            }, 
            { // spawn room selection params
                explicit: room.name
            }
        );
    } 
    if( pioneer ){
        // ensure room has a pioneer flag
        let flag = FlagDir.find(FLAG_COLOR.claim.pioneer, room);
        if( !flag ){
            room.newFlag(FLAG_COLOR.claim.pioneer);
        }
    }
};
// for each flag
mod.handleFlagFound = flag => {
    // if it is a pioneer single or spawn
    if( flag.compareTo(FLAG_COLOR.claim.pioneer) && Task.nextCreepCheck(flag, mod.name)){
        Util.set(flag.memory, 'task', mod.name);
        // check if a new creep has to be spawned
        Task.pioneer.checkForRequiredCreeps(flag);
    }
};
// check if a new creep has to be spawned
mod.checkForRequiredCreeps = (flag) => {
    //only when room is owned
    if( !flag || (flag.room && !flag.room.my && !flag.room.reserved)) {
        if (!PIONEER_UNOWNED) {
            return console.log("Pioneer room not owned", Util.stack());
        }
        const owner = flag.room.owner || flag.room.reservation;
        if (owner && !Task.reputation.isAlly(owner)) {
            return logError(`Pioneer target room owned by ${owner}`);
        }
    }

    // get task memory
    let memory = Task.pioneer.memory(flag);

    // re-validate if too much time has passed in the queue
    Task.validateAll(memory, flag, mod.name, {roomName: flag.pos.roomName, subKey: 'pioneer', checkValid: true});
    
    // decide number of pioneers required
    let count = memory.queued.length + memory.spawning.length + memory.running.length;
        
    // count creeps assigned to task
    // if creep count below requirement spawn a new creep creep 
    if( count < 1 ) {
        const definition = Task.pioneer.creep.pioneer;
        Task.spawn(
            definition, // creepDefinition
            { // destiny
                task: 'pioneer', // taskName
                targetName: flag.name, // targetName
                flagName: flag.name, // custom
                type: definition.behaviour,
            }, 
            { // spawn room selection params
                targetRoom: flag.pos.roomName, 
                minEnergyCapacity: 400, // weight of fixedBody
                rangeRclRatio: 2 // stronger preference of higher RCL rooms
            },
            creepSetup => { // callback onQueued
                let memory = Task.pioneer.memory(Game.flags[creepSetup.destiny.targetName]);
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
    if ( !params.destiny || !params.destiny.task || params.destiny.task != 'pioneer' )
        return;
    // get flag which caused queueing of that creep
    let flag = Game.flags[params.destiny.flagName];
    if (flag) {
        // get task memory
        let memory = Task.pioneer.memory(flag);
        // save spawning creep to task memory
        memory.spawning.push(params);

        // clean/validate task memory queued creeps
        const type = params.destiny.type;
        // default to both as temporary migration
        const priority = type ? _.find(Task.pioneer.creep, {behaviour: type}).queue : ['Low', 'High'];
        Task.validateQueued(memory, flag, mod.name, {queues: [priority]});
    }
};
// when a creep completed spawning
mod.handleSpawningCompleted = creep => {
    // ensure it is a creep which has been requested by this task (else return)
    if (!creep.data || !creep.data.destiny || !creep.data.destiny.task || creep.data.destiny.task != 'pioneer')
        return;
    // get flag which caused request of that creep
    let flag = Game.flags[creep.data.destiny.flagName];
    if (flag) {
        // calculate & set time required to spawn and send next substitute creep
        // TODO: implement better distance calculation
        creep.data.predictedRenewal = creep.data.spawningTime + (routeRange(creep.data.homeRoom, flag.pos.roomName)*50);

        // get task memory
        let memory = Task.pioneer.memory(flag);
        // save running creep to task memory
        memory.running.push(creep.name);
        // clean/validate task memory spawning creeps
        Task.validateSpawning(memory, flag, mod.name);
    }
};
// when a creep died (or will die soon)
mod.handleCreepDied = name => {
    // get creep memory
    let mem = Memory.population[name];
    // ensure it is a creep which has been requested by this task (else return)
    if (!mem || !mem.destiny || !mem.destiny.task || mem.destiny.task != 'pioneer')
        return;
    // get flag which caused request of that creep
    let flag = Game.flags[mem.destiny.flagName];
    if (flag) {
        let memory = Task.pioneer.memory(flag);
        Task.validateRunning(memory, flag, mod.name, {roomName: flag.pos.roomName, deadCreep: name});
    }
};
// get task memory
mod.memory = (flag) => {
    if( !flag.memory.tasks ) 
        flag.memory.tasks = {};
    if( !flag.memory.tasks.pioneer ) {
        flag.memory.tasks.pioneer = {
            queued: [], 
            spawning: [],
            running: []
        };
    }
    return flag.memory.tasks.pioneer;
};
mod.creep = {
    pioneer: {
        fixedBody: {
            [CARRY]: 2,
            [MOVE]: 2,
            [WORK]: 2,
        },
        multiBody: [WORK, MOVE, CARRY],
        name: "pioneer", 
        behaviour: "pioneer", 
        queue: 'Low'
    },
    worker: {
        fixedBody: [MOVE, CARRY, WORK],
        behaviour: 'collapseWorker',
        queue: 'High'
    }
};
