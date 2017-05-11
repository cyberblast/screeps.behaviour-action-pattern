let mod = {};
module.exports = mod;
mod.name = 'delivery';
mod.minControllerLevel = 4;
// hook into events
mod.register = () => {};
mod.memory = (roomName) => {
    let memory = Task.memory(mod.name, roomName);
    if( !memory.hasOwnProperty('queued') ){
        memory.queued = [];
    }
    if( !memory.hasOwnProperty('spawning') ){
        memory.spawning = [];
    }
    if( !memory.hasOwnProperty('running') ){
        memory.running = [];
    }
    return memory;
};
mod.memoryKey = function(creepData) {
    const flag = Game.flags[creepData.destiny.targetName];
    return flag && flag.pos.roomName;
};
mod.checkFlag = (flag) => {
    return flag.room && flag.room.my && flag.compareTo(FLAG_COLOR.invade.robbing) && Task.nextCreepCheck(flag, mod.name);
};
mod.handleFlagFound = function(flag) {
    // if it is a robbing flag
    if (Task.delivery.checkFlag(flag)) {
        // this is an energy source as long as a destination exists
        Task.delivery.checkForRequiredCreeps(flag); // TODO destination
    }
};
mod.maxCreeps = (flag) => !(flag.room && flag.room.storage) ? 1 : Math.floor(flag.room.storage.charge * 2);
mod.checkForRequiredCreeps = function(flag) {
    // check for delivery en route, and spawn a new one if the last was successful
    const memory = Task.delivery.memory(flag.pos.roomName);

    Task.validateAll(memory, flag, mod.name, {roomName: flag.pos.roomName, checkValid: true});
    if (memory.queued.length + memory.spawning.length > 0) {
        return;
    }

    const limit = Task.delivery.maxCreeps(flag);
    // if creep count below requirement spawn a new creep creep
    if (memory.running.length < limit) {
        // find flag for delivery or calculate home room
        const deliveryFlag = FlagDir.find(FLAG_COLOR.claim.delivery, flag.pos); // TODO mod, modArgs to re-cost the room?
        let targetRoom = deliveryFlag && deliveryFlag.pos.roomName;
        if( !targetRoom ) {
            const room = Room.findSpawnRoom({targetRoom: flag.pos.roomName});
            if( !room ) {
                // TODO error, cloak flag?
                return;
            }
            targetRoom = room.name;
        }

        Task.spawn(
            Task.delivery.creep.recycler, // creepDefinition
            { // destiny
                task: mod.name, // taskName
                targetName: flag.name,
                targetRoom,
            },
            { // spawn room selection params
                explicit: flag.pos.roomName, // TODO non-explicit delivery? levelize available spawn and storage energy?
                targetRoom,
                minEnergyCapacity: 100
            },
            creepSetup => { // callback onQueued
                const memory = Task.delivery.memory(Game.flags[creepSetup.destiny.targetName].pos.roomName);
                memory.queued.push({
                    room: creepSetup.queueRoom,
                    name: creepSetup.name
                });
            });
    }
};
mod.handleSpawningStarted = function(params) {
    // ensure it is a creep which has been queued by this task (else return)
    if ( !params.destiny || !params.destiny.task || params.destiny.task != mod.name )
        return;
    // get flag which caused queueing of that creep
    let flag = Game.flags[params.destiny.targetName];
    if (flag) {
        // get task memory
        let memory = Task.delivery.memory(flag.pos.roomName);
        // save spawning creep to task memory
        memory.spawning.push(params);
        Task.validateQueued(memory, flag, mod.name);
    }

    // assign destination flag?
};
mod.handleSpawningCompleted = function(creep) {
    // ensure it is a creep which has been queued by this task (else return)
    if ( !creep.data || !creep.data.destiny || !creep.data.destiny.task || creep.data.destiny.task != mod.name )
        return;
    creep.data.homeRoom = creep.data.destiny.homeRoom || creep.data.homeRoom;
    creep.data.travelRoom = creep.data.destiny.targetRoom || creep.data.travelRoom;

    // get flag which caused queueing of that creep
    let flag = Game.flags[creep.data.destiny.targetName];
    if (flag) {
        // get task memory
        let memory = Task.delivery.memory(flag.pos.roomName);
        Task.validateSpawning(memory, flag, mod.name);
        creep.data.predictedRenewal = creep.data.spawningTime + (routeRange(creep.data.homeRoom, flag.pos.roomName)*50);

        // save running creep to task memory
        memory.running.push(creep.name);
    }
};
mod.handleCreepDied = name => {
    // get creep memory
    const mem = Memory.population[name];
    // ensure it is a creep which has been requested by this task (else return)
    if (!mem || !mem.destiny || !mem.destiny.task || mem.destiny.task != mod.name)
        return;
    // get flag which caused request of that creep
    const flag = Game.flags[mem.destiny.targetName];
    if (flag) {
        const memory = Task.delivery.memory(flag);
        Task.validateRunning(memory, flag, mod.name, {roomName: flag.pos.roomName, deadCreep: name});
    }
};
mod.creep = {
    recycler: {
        fixedBody: [CARRY, MOVE],
        multiBody: [CARRY, MOVE],
        name: "recycler",
        behaviour: "recycler",
        queue: 'Low'
    }
};
