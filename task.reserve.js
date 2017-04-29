// This task will react on exploit, reserve and remotemine flags, sending a reserving creep to the flags position.
let mod = {};
module.exports = mod;
mod.name = 'reserve';
mod.spawnRoomMaxRange = 6;
mod.VALID_RESERVATION = 1000;
mod.URGENT_RESERVATION = 250;
mod.creep = {
    reserver: {
        fixedBody: {
            [CLAIM]: 2,
            [MOVE]: 2,
        },
        multiBody: [CLAIM, MOVE],
        maxMulti: 7,
        name: "reserver", 
        behaviour: "claimer"
    },
};
// hook into events
mod.register = () => {};
// for each flag
mod.handleFlagFound = flag => {
    // if it is a reserve, exploit or remote mine flag
    if ((flag.compareTo(FLAG_COLOR.claim.reserve) || flag.compareTo(FLAG_COLOR.invade.exploit) || flag.compareTo(FLAG_COLOR.claim.mining)) &&
        (Room.isControllerRoom(flag.pos.roomName) || (flag.room && flag.room.controller))) {
        const memory = Task.reserve.memory(flag);
        if (flag.room) {
            flag.memory.lastVisible = Game.time;
            flag.memory.ticksToEnd = flag.room.controller.reservation && flag.room.controller.reservation.ticksToEnd;
            const currCheck = _.get(flag.memory, ['nextCheck', mod.name], Infinity);
            const nextCheck = Game.time + flag.memory.ticksToEnd - mod.VALID_RESERVATION;
            if (nextCheck < currCheck && !memory.waitForCreeps) {
                const count = memory.queued.length + memory.spawning.length + memory.running.length;
                if (count === 0) { // and not currently spawning
                    _.set(flag.memory, ['nextCheck', mod.name], nextCheck);
                } else {
                    memory.waitForCreeps = true;
                }
            }
        }
        if (Task.nextCreepCheck(flag, mod.name)) {
            delete memory.waitForCreeps;
            Util.set(flag.memory, 'task', mod.name);
            // check if a new creep has to be spawned
            Task.reserve.checkForRequiredCreeps(flag);
        }
    }
};
// check if a new creep has to be spawned
mod.checkForRequiredCreeps = function(flag) {
    let spawnParams;
    if (flag.compareTo(FLAG_COLOR.claim.mining)) {
        spawnParams = Task.mining.strategies.reserve.spawnParams(flag);
    } else if( flag.compareTo(FLAG_COLOR.invade.exploit) ) {
        spawnParams = mod.strategies.defaultStrategy.spawnParams(flag);
        spawnParams.queue = 'Low'; // privateer reserve is always low queue
    } else {
        spawnParams = mod.strategies.defaultStrategy.spawnParams(flag);
    }

    // get task memory
    let memory = Task.reserve.memory(flag);
    // clean/validate task memory queued creeps
    Task.validateAll(memory, flag, mod.name, {roomName: flag.pos.roomName, queues: ['Low', 'Medium'], checkValid: true});
    
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
                minEnergyCapacity: 1300,
                maxRange: this.spawnRoomMaxRange,
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
        Task.validateQueued(memory, flag, mod.name, {queues: ['Low', 'Medium']});
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
        Task.validateSpawning(memory, flag, mod.name);
        // save running creep to task memory
        memory.running.push(creep.name);
    }
};
// when a creep died (or will die soon)
mod.handleCreepDied = name => {
    // get creep memory
    let mem = Memory.population[name];
    // ensure it is a creep which has been requested by this task (else return)
    if (!mem || !mem.destiny || !mem.destiny.task || mem.destiny.task != mod.name)
        return;
    // get flag which caused request of that creep
    let flag = Game.flags[mem.destiny.targetName];
    if (flag) {
        const memory = Task.reserve.memory(flag);
        Task.validateRunning(memory, flag, mod.name, {roomName: flag.pos.roomName, deadCreep: name});
    }
};
mod.nextAction = creep => {
    // override behaviours nextAction function
    // this could be a global approach to manipulate creep behaviour
    if (creep.data.destiny && creep.data.destiny.room !== creep.room.name) {
        // go to target room
        return Creep.action.travelling.assignRoom(creep, creep.data.destiny.room);
    }
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
    const memory = Util.get(flag.memory, ['tasks', 'reserve'], {
        queued: [], 
        spawning: [],
        running: []
    });
    // temporary migration, remove if in dev
    delete memory.valid;
    return memory;
};
mod.strategies = {
    defaultStrategy: {
        name: `default-${mod.name}`,
        spawnParams: function(flag) { //:{count:number, priority:string}
            const params = {count: 0, queue: 'Low'}; // default to no spawn
            const hasFlag = !!flag;
            const hasController = hasFlag && (Room.isControllerRoom(flag.pos.roomName) || (flag.room && flag.room.controller));
            if (!hasFlag || !hasController) {
                if( DEBUG && TRACE ) trace('Task', {hasFlag, hasController, checkForRequiredCreeps:'skipping room, missing flag or controller',
                    [mod.name]:'checkForRequiredCreeps', Task:mod.name});
                return params;
            }
            if (flag.room) {
                flag.memory.lastVisible = Game.time;
                flag.memory.ticksToEnd = flag.room.controller.reservation && flag.room.controller.reservation.ticksToEnd;
                const validReservation = flag.room.controller.reservation && (flag.room.controller.reservation.ticksToEnd > 1000
                    || flag.room.controller.reservation.username !== ME);
                const isOwned = !!(flag.room.controller.owner);
                if (isOwned || validReservation) {
                    if( DEBUG && TRACE ) trace('Task', {validReservation, isOwned, checkForRequiredCreeps:'skipping room, reserved or owned',
                        [mod.name]:'checkForRequiredCreeps', Task:mod.name});
                    return params;
                }
                const urgent = !flag.room.controller.reservation || flag.room.controller.reservation.ticksToEnd < 250;
                params.count = 1;
                if (urgent) params.queue = 'Medium';
                if( DEBUG && TRACE ) {
                    const type = urgent ? 'urgent' : ' ';
                    trace('Task', {validReservation, isOwned, urgent, checkForRequiredCreeps:`sending${type}reserver`,
                        [mod.name]:'checkForRequiredCreeps', Task:mod.name});
                }
            } else if (_.isUndefined(flag.memory.lastVisible) ||
                Game.time - flag.memory.lastVisible > ((flag.memory.ticksToEnd - 250) || 250)) {
                params.count = 1;
                params.queue = 'Medium';
                if( DEBUG && TRACE ) trace('Task', {lastVisible: flag.memory.lastVisible,
                    tickToEnd: flag.memory.ticksToEnd, checkForRequiredCreeps:'sending urgent reserver, no visibility',
                    [mod.name]:'checkForRequiredCreeps', Task:mod.name});                
            }
            return params;
        },
    },
};