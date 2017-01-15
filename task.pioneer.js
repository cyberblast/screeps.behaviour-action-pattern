// This task will react on pioneer flags - 4 for Green/White, 1 for Green/Red
module.exports = {
    // hook into events
    register: () => {
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
    },
    // for each flag
    handleFlagFound: flag => {
        // if it is a pioneer, exploit or remote mine flag
        if( flag.color == FLAG_COLOR.claim.pioneer.color && flag.secondaryColor == FLAG_COLOR.claim.pioneer.secondaryColor ||
            flag.color == FLAG_COLOR.claim.spawn.color && flag.secondaryColor == FLAG_COLOR.claim.spawn.secondaryColor){
            // check if a new creep has to be spawned
            Task.pioneer.checkForRequiredCreeps(flag);
        }
    },
    // check if a new creep has to be spawned
    checkForRequiredCreeps: (flag) => {
        //only when room is owned
        if( !flag || (flag.room && !flag.room.controller.my) ) return console.log("Pioneer room not owned");
        
        // get task memory
        let memory = Task.pioneer.memory(flag);

        // decide number of pioneers required
        let count = memory.queued.length + memory.spawning.length + memory.running.length;
        var pNeed = 1;
        if(flag.color == FLAG_COLOR.claim.spawn.color && flag.secondaryColor == FLAG_COLOR.claim.spawn.secondaryColor) pNeed = 4;
       // console.log("pionner's requested: " + count + " of " + pNeed + " for " + flag.pos.roomName)
    
        // count creeps assigned to task
 	    
        // if creep count below requirement spawn a new creep creep 
        if( count < pNeed ) {
            // get nearest room
            let room = Room.bestSpawnRoomFor(flag.pos.roomName);
            // define new creep
            let fixedBody = Task.pioneer.creep.pioneer.fixedBody;
            let multiBody = Task.pioneer.creep.pioneer.multiBody;
            let name = Task.pioneer.creep.pioneer.name + '-' + flag.pos.roomName;
            let creep = {
                parts: Creep.Setup.compileBody(room, fixedBody, multiBody, true),
                name: name,
                maxMulti: 4,
                behaviour: Task.pioneer.creep.pioneer.behaviour,
                destiny: { task: "pioneer", flagName: flag.name }
            };
            if( creep.parts.length === 0 ) {
                // creep has no body. 
                global.logSystem(flag.pos.roomName, dye(CRAYON.error, 'pioneer Flag tried to queue a zero parts body creep. Aborted.' ));
                return;
            }
            
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
    },
    // when a creep completed spawning
    handleSpawningCompleted: creep => {
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
    },
    // when a creep died (or will die soon)
    handleCreepDied: name => {
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
                let creep = Game.creeps[o];
                // invalidate old creeps for predicted spawning
                // TODO: better distance calculation
                let prediction;
                if( creep.data && creep.data.predictedRenewal ) prediction = creep.data.predictedRenewal;
                else if( creep.data && creep.data.spawningTime ) prediction = (creep.data.spawningTime + (routeRange(creep.data.homeRoom, flag.pos.roomName)*50));
                else prediction = (routeRange(creep.data.homeRoom, flag.pos.roomName)+1) * 50;
                if( creep && creep.name != name && creep.ticksToLive > prediction ) {
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
        if( !flag.memory.tasks.pioneer ) {
            flag.memory.tasks.pioneer = {
                queued: [], 
                spawning: [],
                running: []
            }
        }
        return flag.memory.tasks.pioneer;
    },
    creep: {
        pioneer: {
            fixedBody: [WORK, WORK, MOVE, MOVE, CARRY, CARRY],
            multiBody: [WORK, MOVE, CARRY],
            name: "pioneer", 
            behaviour: "pioneer"
        },
    }
};


