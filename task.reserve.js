// This task will react on exploit, reserve and remotemine flags, sending a reserving creep to the flags position.
module.exports = {
    minControllerLevel: 4,
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
            flag.color == FLAG_COLOR.invade.exploit.color && flag.secondaryColor == FLAG_COLOR.invade.exploit.secondaryColor ||
            flag.color == FLAG_COLOR.claim.mining.color && flag.secondaryColor == FLAG_COLOR.claim.mining.secondaryColor){
            // check if a new creep has to be spawned
            Task.reserve.checkForRequiredCreeps(flag);
        }
    },
    // check if a new creep has to be spawned
    checkForRequiredCreeps: (flag) => {
        //only when controller is under 2500 ticks or has no controller (requires vision)
        if( !flag || (flag.room && !flag.room.controller) || (flag.room && flag.room.controller && flag.room.controller.reservation && flag.room.controller.reservation.ticksToEnd > 2500)) return;
        
        // get task memory
        let memory = Task.reserve.memory(flag);
        // count creeps assigned to task
 
        let count = memory.queued.length + memory.spawning.length + memory.running.length;
        // Allow a second claimer in medium queue if reservation low
        let lowReservation = ( !flag.room ||
                (flag.room.controller && !flag.room.controller.reservation) ||
                (flag.room.controller && flag.room.controller.reservation && flag.room.controller.reservation.ticksToEnd < 250)) && count == 1; // always let it queue one in low as well

        // if creep count below requirement spawn a new creep creep 
        if( count < 1 || lowReservation) {
            Task.spawn(
                lowReservation ? 'Medium' : 'Low', // queue
                'reserve', // taskname
                flag.pos.roomName, // targetRoom
                flag.name, // targetName
                Task.reserve.creep.reserver, // creepDefinition
                null, // custom destiny attributes
                creepSetup => { // callback onQueued
                    let memory = Task.reserve.memory(Game.flags[creepSetup.destiny.targetName]);
                    memory.queued.push({
                        room: creepSetup.queueRoom,
                        name: creepSetup.name
                });
            });
        }
    },
    // when a creep starts spawning
    handleSpawningStarted: params => { // params: {spawn: spawn.name, name: creep.name, destiny: creep.destiny}
        // ensure it is a creep which has been queued by this task (else return)
        
        if ( !params.destiny || !params.destiny.task || params.destiny.task != 'reserve' )
            return;
        // get flag which caused queueing of that creep
        // TODO: remove  || creep.data.destiny.flagName (temporary backward compatibility)
        let flag = Game.flags[params.destiny.targetName || params.destiny.flagName];
        if (flag) {
            // get task memory
            let memory = Task.reserve.memory(flag);
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
    },
    // when a creep completed spawning
    handleSpawningCompleted: creep => {
        // ensure it is a creep which has been requested by this task (else return)
        if (!creep.data || !creep.data.destiny || !creep.data.destiny.task || creep.data.destiny.task != 'reserve')
            return;
        // get flag which caused request of that creep
        // TODO: remove  || creep.data.destiny.flagName (temporary backward compatibility)
        let flag = Game.flags[creep.data.destiny.targetName || creep.data.destiny.flagName];
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
        // TODO: remove  || creep.data.destiny.flagName (temporary backward compatibility)
        let flag = Game.flags[mem.destiny.targetName || mem.destiny.flagName];
        if (flag) {
            // get task memory
            let memory = Task.reserve.memory(flag);
            // clean/validate task memory running creeps
            let running = []
            let validateRunning = o => {
                // invalidate dead or old creeps for predicted spawning
                let creep = Game.creeps[o];
                if( !creep || !creep.data ) return
                // TODO: better distance calculation
                let prediction;
                if( creep.data.predictedRenewal ) prediction = creep.data.predictedRenewal;
                else if( creep.data.spawningTime ) prediction = (creep.data.spawningTime + (routeRange(creep.data.homeRoom, flag.pos.roomName)*50));
                else prediction = (routeRange(creep.data.homeRoom, flag.pos.roomName) + 1) * 50;
                if( creep.name != name && creep.ticksToLive > prediction ) {
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
    },
    creep: {
        reserver: {
            fixedBody: [CLAIM, CLAIM, MOVE, MOVE],
            multiBody: [],
            name: "reserver", 
            behaviour: "claimer"
        },
    }
};
