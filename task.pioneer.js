// This task will react on pioneer flags - 4 for Green/White, 1 for Green/Red
let mod = {};
module.exports = mod;
// hook into events
mod.register = () => {
    // when a new flag has been found (occurs every tick, for each flag)
    Flag.found.on( flag => Task.pioneer.handleFlagFound(flag) );
    // a creep starts spawning
    Creep.spawningStarted.on( params => Task.pioneer.handleSpawningStarted(params) );
    // a creep completed spawning
    Creep.spawningCompleted.on( creep => Task.pioneer.handleSpawningCompleted(creep) );
    // a creep will die soon
    Creep.predictedRenewal.on( creep => Task.pioneer.handleCreepDied(creep.name) );
    // a creep died
    Creep.died.on( name => Task.pioneer.handleCreepDied(name) );
    // a room collapsed
    Room.collapsed.on( room => Task.pioneer.handleRoomDied(room) );
};
mod.handleRoomDied = room => {
    // try to spawn a worker
    let pioneer = true;
    if( room.energyAvailable > 199 ) {
        // flush high queue
        room.spawnQueueHigh.splice(0, room.spawnQueueHigh.length);
        pioneer = !Task.spawn(
            Task.pioneer.creep.worker, // creepDefinition
            { // destiny
                task: 'pioneer', // taskName
                targetName: room.name // targetName
            }, 
            { // spawn room selection params
                explicit: room.name
            }
        );
    } 
    if( pioneer ){
        // ensure room has a pioneer flag
        let pos = new RoomPosition(25, 25, room.name);
        let flag = FlagDir.find(FLAG_COLOR.claim.pioneer, pos, true);
        if( !flag ){
            room.createFlag(pos, null, FLAG_COLOR.claim.pioneer.color, FLAG_COLOR.claim.pioneer.secondaryColor);
        }
    }
}
// for each flag
mod.handleFlagFound = flag => {
    // if it is a pioneer single or spawn
    if( flag.color == FLAG_COLOR.claim.pioneer.color && flag.secondaryColor == FLAG_COLOR.claim.pioneer.secondaryColor ){
        // check if a new creep has to be spawned
        Task.pioneer.checkForRequiredCreeps(flag);
    }
};
// check if a new creep has to be spawned
mod.checkForRequiredCreeps = (flag) => {
    //only when room is owned
    if( !flag || (flag.room && !flag.room.my && !flag.room.reserved)) {
        if (!PIONEER_UNOWNED) {
            return console.log("Pioneer room not owned");
        }
        const owner = flag.room.owner || flag.room.reservation;
        if (owner) {
            return logError(`Pioneer target room owned by ${owner}`);
        }
    }

    // get task memory
    let memory = Task.pioneer.memory(flag);

    // decide number of pioneers required
    let count = memory.queued.length + memory.spawning.length + memory.running.length;
        
    // count creeps assigned to task
    // if creep count below requirement spawn a new creep creep 
    if( count < 1 ) {
        Task.spawn(
            Task.pioneer.creep.pioneer, // creepDefinition
            { // destiny
                task: 'pioneer', // taskName
                targetName: flag.name, // targetName
                flagName: flag.name // custom
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
        let queued = []
        let validateQueued = o => {
            let room = Game.rooms[o.room];
            if( (room.spawnQueueMedium.some( c => c.name == o.name)) || (room.spawnQueueLow.some( c => c.name == o.name)) ){
                queued.push(o);
            }
        };
        memory.queued.forEach(validateQueued);
        memory.queued = queued;
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
        let spawning = []
        let validateSpawning = o => {
            let spawn = Game.spawns[o.spawn];
            if( spawn && ((spawn.spawning && spawn.spawning.name == o.name) || (spawn.newSpawn && spawn.newSpawn.name == o.name))) {
                count++;
                spawning.push(o);
            }
        };
        memory.spawning.forEach(validateSpawning);
        memory.spawning = spawning;
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
        // get task memory
        let memory = Task.pioneer.memory(flag);
        // clean/validate task memory running creeps
        let running = []
        let validateRunning = o => {
            // invalidate dead or old creeps for predicted spawning
            let creep = Game.creeps[o];
            // invalidate old creeps for predicted spawning
            if( !creep || !creep.data ) return
            // TODO: better distance calculation
            let prediction;
            if( creep.data.predictedRenewal ) prediction = creep.data.predictedRenewal;
            else if( creep.data.spawningTime ) prediction = (creep.data.spawningTime + (routeRange(creep.data.homeRoom, flag.pos.roomName)*50));
            else prediction = (routeRange(creep.data.homeRoom, flag.pos.roomName)+1) * 50;
            if( creep.name != name && creep.ticksToLive > prediction ) {
                running.push(o);
            }
        };
        memory.running.forEach(validateRunning);
        memory.running = running;
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
        }
    }
    return flag.memory.tasks.pioneer;
};
mod.creep = {
    pioneer: {
        fixedBody: [WORK, WORK, MOVE, MOVE, CARRY, CARRY],
        multiBody: [WORK, MOVE, CARRY],
        name: "pioneer", 
        behaviour: "pioneer", 
        queue: 'Low'
    },
    worker: {
        fixedBody: [MOVE, CARRY, WORK],
        behaviour: 'worker',
        queue: 'High'
    }
};
