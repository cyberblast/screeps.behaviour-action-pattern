// This task will react on exploit, reserve and remotemine flags, sending a reserving creep to the flags position.
module.exports = {
    // hook into events
    register: () => {
        // when a new flag has been found (occurs every tick, for each flag)
        Flag.found.on( flag => Task.reserve.handleFlagFound(flag) );
        // a creep starts spawning
        Creep.spawningStarted.on( params => Task.reserve.handleSpawningStarted(params) );
        // a creep completed spawning
        Creep.spawningCompleted.on( creep => Task.reserve.handleSpawningCompleted(creep) );
        // a creep will die soon
        Creep.predictedRenewal.on( creep => Task.reserve.handleCreepDied(creep.name) );
        // a creep died
        Creep.died.on( name => Task.reserve.handleCreepDied(name) );
    },
    // for each flag
    handleFlagFound: flag => {
        // if it is a reserve, exploit or remote mine flag
        if( flag.color == FLAG_COLOR.claim.reserve.color && flag.secondaryColor == FLAG_COLOR.claim.reserve.secondaryColor ||
            flag.color == FLAG_COLOR.invade.exploit.color && flag.secondaryColor == FLAG_COLOR.invade.exploit.secondaryColor){
            // flag.color == FLAG_COLOR.claim.mining.color && flag.secondaryColor == FLAG_COLOR.claim.mining.secondaryColor

            // check if a new creep has to be spawned
            
            Task.reserve.checkForRequiredCreeps(flag);
        }
    },
    // check if a new creep has to be spawned
    checkForRequiredCreeps: (flag) => {
        //only when controller is under 2500 ticks
        if( flag && flag.room && flag.room.controller && flag.room.controller.reservation && flag.room.controller.reservation.ticksToEnd > 2500) return;
        // get task memory
        let memory = Task.reserve.memory(flag);
        // count creeps assigned to task
        //TODO - Only spawn if controller is below 2000 ticks (target.reservation.ticksToEnd < 4999)
        let count = memory.queued.length + memory.spawning.length + memory.running.length;// + ((flag) => ( flag.room.controller.reservation.ticksToEnd < 2000 ) ? 0 : 1);
        // if creep count below requirement spawn a new creep creep 
        if( count < 1 ) {
            // get nearest room
            let room = Room.bestSpawnRoomFor(flag.pos.roomName);
            // define new creep
            let fixedBody = [CLAIM, MOVE, CLAIM, MOVE];
            let multiBody = [];
            let name = 'reserve-' + flag.pos.roomName;
            let creep = {
                parts: Creep.Setup.compileBody(room, fixedBody, multiBody, true),
                name: name,
                behaviour: 'claimer',
                setup: 'claimer',
                destiny: { task: "reserve", flagName: flag.name }
            };
            if( creep.parts.length === 0 ) {
                // creep has no body. 
                global.logSystem(flag.pos.roomName, dye(CRAYON.error, 'reserve Flag tried to queue a zero parts body creep. Aborted.' ));
                return;
            }
            // queue creep for spawning
            room.spawnQueueLow.push(creep);
            // save queued creep to task memory
            memory.queued.push({
                room: room.name,
                name: name
            });
        }
    },
    // when a creep starts spawning
    handleSpawningStarted: params => { // params: {spawn: spawn.name, name: creep.name, destiny: creep.destiny}
        // ensure it is a creep which has been queued by this task (else return)
        if ( !params.destiny || !params.destiny.task || params.destiny.task != 'reserve' )
            return;
        // get flag which caused queueing of that creep
        let flag = Game.flags[params.destiny.flagName];
        if (flag) {
            // get task memory
            let memory = Task.reserve.memory(flag);
            // save spawning creep to task memory
            memory.spawning.push(params);
            // clean/validate task memory queued creeps
            let queued = []
            let validateQueued = o => {
                let room = Game.rooms[o.room];
                if(room.spawnQueueLow.some( c => c.name == o.name)){
                    queued.push(o);
                }
            };
            memory.queued.forEach(validateQueued);
            memory.queued = queued;
        }
    },
    // when a creep completed spawning
    handleSpawningCompleted: creep => {
        // ensure it is a creep which has been requested by this task (else return)
        if (!creep.data || !creep.data.destiny || !creep.data.destiny.task || creep.data.destiny.task != 'reserve')
            return;
        // get flag which caused request of that creep
        let flag = Game.flags[creep.data.destiny.flagName];
        if (flag) {
            // calculate & set time required to spawn and send next substitute creep
            // TODO: implement better distance calculation
            creep.data.predictedRenewal = creep.data.spawningTime + (routeRange(creep.data.homeRoom, flag.pos.roomName)*50);

            // get task memory
            let memory = Task.reserve.memory(flag);
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
    },
    // when a creep died (or will die soon)
    handleCreepDied: name => {
        // get creep memory
        let mem = Memory.population[name];
        // ensure it is a creep which has been requested by this task (else return)
        if (!mem || !mem.destiny || !mem.destiny.task || mem.destiny.task != 'reserve')
            return;
        // get flag which caused request of that creep
        let flag = Game.flags[mem.destiny.flagName];
        if (flag) {
            // get task memory
            let memory = Task.reserve.memory(flag);
            // clean/validate task memory running creeps
            let running = []
            let validateRunning = o => {
                let creep = Game.creeps[o];
                // invalidate old creeps for predicted spawning
                // TODO: better distance calculation
                if( creep && creep.name != name && creep.data !== undefined && creep.data.spawningTime !== undefined && creep.ticksToLive > (creep.data.spawningTime + (routeRange(creep.data.homeRoom, flag.pos.roomName)*25) ) ) {
                    running.push(o);
                }
            };
            memory.running.forEach(validateRunning);
            memory.running = running;
        }
    },
    // get task memory
    memory: (flag) => {
        if( !flag.memory.tasks ) 
            flag.memory.tasks = {};
        if( !flag.memory.tasks.reserve ) {
            flag.memory.tasks.reserve = {
                queued: [], 
                spawning: [],
                running: []
            }
        }
        return flag.memory.tasks.reserve;
    },

    nextAction: creep => {
        // override behaviours nextAction function
        // this could be a global approach to manipulate creep behaviour

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
                    return;
            }
        }
    }
 

};


