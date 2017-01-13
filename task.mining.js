var mod = {
    register: () => {
        // when a new flag has been found (occurs every tick, for each flag)
        Flag.found.on( flag => Task.mining.handleFlagFound(flag) );
        // a creep starts spawning
        Creep.spawningStarted.on( params => Task.mining.handleSpawningStarted(params) );
        // a creep completed spawning
        Creep.spawningCompleted.on( creep => Task.mining.handleSpawningCompleted(creep) );
        // a creep will die soon
        Creep.predictedRenewal.on( creep => Task.mining.handleCreepDied(creep.name) );
        // a creep died
        Creep.died.on( name => Task.mining.handleCreepDied(name) );

        // remove dead flags
        // Task.mining.removeDeadFlags();
    },
    checkFlag: (flag) => {
        if( flag.color == FLAG_COLOR.claim.mining.color && flag.secondaryColor == FLAG_COLOR.claim.mining.secondaryColor )
            return true;
        return false;
    },
    // removeDeadFlags: () => {
    //     flagMemory = Task.mining.memory("flags");

    //     let validFlag = f => { Game.flags[f] && Game.flags[f].pos.roomName == flagMemory.names[f].pos.roomName }
    //     let keepOrDelete = f => {
    //         if( validFlag(f) )
    //             return;
    //         Task.clearMemory("mining", flagMemory.names[f].pos.roomName);
    //         delete flagMemory.names[f];
    //     }
    //     _.forEach(Object.keys(flagMemory.names), keepOrDelete)
    // },
    handleFlagFound: flag => {
        if( Task.mining.checkFlag(flag) ){
            // check if a new creep has to be spawned
            Task.mining.checkForRequiredCreeps(flag);
            // add flags into memory
            // flagMemory = Task.mining.memory("flags");
            // if(!flagMemory.names) flagMemory.names = {};
            // if(!flagMemory.names[flag.name])
            //     flagMemory.names[flag.name] = flag;
        }

    },
    handleSpawningStarted: params => {
        if ( !params.destiny || !params.destiny.task || params.destiny.task != 'mining' )
            return;
        let memory = Task.mining.memory(params.destiny.room);
        // memory.creeps[params.destiny.role][params.name] = Game.creeps[params.name];
        memory.queued[params.destiny.role].pop();
    },
    handleSpawningCompleted: creep => {
        let creepMemory = Memory.population[creep.name];
        if (!creepMemory || !creepMemory.destiny || !creepMemory.destiny.task || creepMemory.destiny.task != 'mining' )
            return;
        Task.mining.nextAction(creep);
    },
    handleCreepDied: creepName => {
        // let creepMemory = Memory.population[creepName];
        // if (!creepMemory || !creepMemory.destiny || !creepMemory.destiny.task || creepMemory.destiny.task != 'mining' )
        //     return;
        // let memory = Task.mining.memory(creepMemory.destiny.room);
        // if( !Game.creeps[creepName] ) {
        //     delete memory.creeps[creepMemory.destiny.role][creepName];
        // }
    },

    // check if a new creep has to be spawned
    checkForRequiredCreeps: (flag) => {
        let spawnRoom = Room.bestSpawnRoomFor(flag.pos.roomName);
        const roomName = flag.pos.roomName;
        const room = Game.rooms[roomName];

        // Use the roomName as key in Task.memory?
        // Prevents accidentally processing same room multiple times if flags > 1
        let memory = Task.mining.memory(roomName);

        // if( !memory.hasOwnProperty('creeps') ){
        //     memory.creeps = {miner:{},hauler:{}};
        // }

        if( !memory.hasOwnProperty('queued') )
            memory.queued = {miner:[], hauler:[], worker:[]};

        if( !memory.queued.hasOwnProperty('miner') )
            memory.queued.miner = [];
        if( !memory.queued.hasOwnProperty('hauler') )
            memory.queued.hauler = [];
        if( !memory.queued.hasOwnProperty('worker') )
            memory.queued.worker = [];

        if( room && !memory.hasOwnProperty('sources') ){
            memory.sources = [];
            let sources = room.find(FIND_SOURCES);
            for(x=0; x<sources.length;x++)
                memory.sources.push(sources[x].id);
        }

        const sourceCount = memory.sources ? memory.sources.length : 1;

        // todo count creeps by type needed per source / mineral
        let haulerCount = memory.queued.hauler.length + _.filter(Game.creeps, function(c){return c.data && c.data.creepType=='remoteHauler' && c.data.destiny.room==roomName;}).length;
        let minerCount = memory.queued.miner.length + _.filter(Game.creeps, function(c){return c.data && c.data.creepType=='remoteMiner' && c.data.destiny.room==roomName;}).length;
        let workerCount = memory.queued.worker.length + _.filter(Game.creeps, function(c){return c.data && c.data.creepType=='remoteWorker' && c.data.destiny.room==roomName;}).length;

        if(minerCount < sourceCount) {
            for(var i = 0; i < sourceCount; i++) {
                let name = 'remoteMiner-' + flag.name;
                let creep = Creep.setup.remoteMiner.buildParams(spawnRoom.structures.spawns[0]);
                creep.name = name;
                creep.destiny = { task: "mining", role: "miner", flagName: flag.name, room: flag.pos.roomName };
                if( creep.parts.length === 0 ) {
                    // creep has no body.
                    global.logSystem(spawnRoom.name, dye(CRAYON.error, 'Mining Flag tried to queue a zero parts body miner. Aborted.' ));
                    return;
                }
                // queue creep for spawning
                spawnRoom.spawnQueueLow.push(creep);

                // save queued creep to task memory
                memory.queued.miner.push({
                    room: roomName,
                    name: name
                });
            }
        }

        if(haulerCount < (sourceCount * REMOTE_HAULER_MULTIPLIER ) ) {
            for(var i = 0; i < sourceCount * REMOTE_HAULER_MULTIPLIER; i++) {
                let creep = Creep.setup.remoteHauler.buildParams(spawnRoom.structures.spawns[0]);
                let name = 'remoteHauler-' + flag.name;
                creep.name = name;
                creep.destiny = { task: "mining", role: "hauler", flagName: flag.name, room: flag.pos.roomName };
                if( creep.parts.length === 0 ) {
                    // creep has no body.
                    global.logSystem(spawnRoom.name, dye(CRAYON.error, 'Mining Flag tried to queue a zero parts body hauler. Aborted.' ));
                    return;
                }
                // queue creep for spawning
                spawnRoom.spawnQueueLow.push(creep);

                // save queued creep to task memory
                memory.queued.hauler.push({
                    room: roomName,
                    name: name
                });
            }
        }

        if(workerCount < REMOTE_WORKER_MULTIPLIER) {
            let creep = Creep.setup.remoteWorker.buildParams(spawnRoom.structures.spawns[0]);
            let name = 'remoteWorker-' + flag.name;
            creep.name = name;
            creep.destiny = { task: "mining", role: "worker", flagName: flag.name, room: flag.pos.roomName };
            if( creep.parts.length === 0 ) {
                // creep has no body.
                global.logSystem(spawnRoom.name, dye(CRAYON.error, 'Mining Flag tried to queue a zero parts body worker. Aborted.' ));
                return;
            }

            // queue creep for spawning
            spawnRoom.spawnQueueLow.push(creep);

            // save queued creep to task memory
            memory.queued.worker.push({
                room: roomName,
                name: name
            });
        }
    },
    memory: key => {
        return Task.memory('mining', key);
    },
    // define action assignment for creeps

    nextAction: creep => {
        // if not in the target room, travel there
        if( creep.room.name != creep.data.destiny.room ){
            Creep.action.travelling.assign(creep, Game.flags[creep.data.destiny.flagName]);
        }
    }
};

module.exports = mod;
