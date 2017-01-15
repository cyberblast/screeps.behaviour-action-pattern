var mod = {
    register: () => {
        // when a new flag has been found (occurs every tick, for each flag)
        Flag.found.on( flag => Task.mining.handleFlagFound(flag) );
        // when a flag has been removed
        Flag.FlagRemoved.on( flagName => Task.mining.handleFlagRemoved(flagName) );
        // a creep starts spawning
        Creep.spawningStarted.on( params => Task.mining.handleSpawningStarted(params) );
    },
    checkFlag: (flag) => {
        if( flag.color == FLAG_COLOR.claim.mining.color && flag.secondaryColor == FLAG_COLOR.claim.mining.secondaryColor ) {
            flag.memory.roomName = flag.pos.roomName;
            flag.memory.task = 'mining';
            return true;
        }
        return false;
    },
    handleFlagRemoved: flagName => {
        // check flag
        let flagMem = Memory.flags[flagName];
        if( flagMem && flagMem.task === 'mining' && flagMem.roomName ){
            // if there is still a mining flag in that room ignore. 
            let flags = FlagDir.filter(FLAG_COLOR.claim.mining, new RoomPosition(25,25,flagMem.roomName), true);
            if( flags && flags.length > 0 ) 
                return;
            else {
                // no more mining in that room. 
                // clear memory
                Task.clearMemory('mining', flagMem.roomName);
            }
        }
    },
    handleFlagFound: flag => {
        // Analyze Flag
        if( Task.mining.checkFlag(flag) ){
            // check if a new creep has to be spawned
            Task.mining.checkForRequiredCreeps(flag);
        }
    },
    // remove creep from task memory of queued creeps
    handleSpawningStarted: params => {
        if ( !params.destiny || !params.destiny.task || params.destiny.task != 'mining' )
            return;
        let memory = Task.mining.memory(params.destiny.room);
        if( memory.queued[params.destiny.type] ) memory.queued[params.destiny.type].pop();
        else if( params.destiny.role ) {
            // temporary migration
            if( params.destiny.role == "hauler" ) params.destiny.type = 'remoteHauler';
            else if( params.destiny.role == "miner" ) params.destiny.type = 'remoteMiner';
            else if( params.destiny.role == "worker" ) params.destiny.type = 'remoteWorker';
            memory.queued[params.destiny.type].pop();
        }
    },
    // check if a new creep has to be spawned
    checkForRequiredCreeps: (flag) => {
        let spawnRoom = Room.bestSpawnRoomFor(flag.pos.roomName);
        const roomName = flag.pos.roomName;
        const room = Game.rooms[roomName];
        // Use the roomName as key in Task.memory?
        // Prevents accidentally processing same room multiple times if flags > 1
        let memory = Task.mining.memory(roomName);

        // get number of sources
        let sourceCount;
        // has visibility. get cached property.
        if( room ) sourceCount = room.sources.length;
        // no visibility, but been there before
        else if( Memory.rooms[roomName] && Memory.rooms[roomName].sources ) sourceCount = Memory.rooms[roomName].sources.length
        // never been there
        else sourceCount = 1;

        // TODO: don't iterate/filter all creeps (3 times) each tick. store numbers into memory (see guard tasks)
        let haulerCount = memory.queued.remoteHauler.length + _.filter(Game.creeps, function(c){return c.data && c.data.creepType=='remoteHauler' && c.data.destiny.room==roomName;}).length;
        let existingMiners = _.filter(Game.creeps, function(c){return c.data && c.data.creepType=='remoteMiner' && c.data.destiny.room==roomName;});
        let minerCount = memory.queued.remoteMiner.length + existingMiners.length;
        let workerCount = memory.queued.remoteWorker.length + _.filter(Game.creeps, function(c){return c.data && c.data.creepType=='remoteWorker' && c.data.destiny.room==roomName;}).length;
        // TODO: calculate creeps by type needed per source / mineral

        if(minerCount < sourceCount) {
            for(let i = minerCount; i < sourceCount; i++) {
                Task.mining.spawn(flag, 'remoteMiner', Task.mining.creepBodies.miner.fixed, Task.mining.creepBodies.miner.multi );
            }
        }
        // only spawn haulers for sources a miner has been spawned for
        let runningMiners = _.filter(existingMiners, creep => creep.spawning === false);
        let maxHaulers = Math.ceil(runningMiners.length * REMOTE_HAULER_MULTIPLIER);
        if(haulerCount < maxHaulers) {
            for(let i = haulerCount; i < maxHaulers; i++) {
                Task.mining.spawn(flag, 'remoteHauler', Task.mining.creepBodies.hauler.fixed, Task.mining.creepBodies.hauler.multi );
            }
        }

        if( room && room.constructionSites.length > 0 && workerCount < REMOTE_WORKER_MULTIPLIER) {
            for(let i = workerCount; i < REMOTE_WORKER_MULTIPLIER; i++) {
                Task.mining.spawn(flag, 'remoteWorker', Task.mining.creepBodies.worker.fixed, Task.mining.creepBodies.worker.multi );
            }
        }
    },
    memory: key => {
        let memory = Task.memory('mining', key);
        if( !memory.hasOwnProperty('queued') ){
            memory.queued = {
                remoteMiner:[], 
                remoteHauler:[], 
                remoteWorker:[]
            };
        }

        // temporary migration
        if( memory.queued.miner ){
            memory.queued.remoteMiner = memory.queued.miner;
            delete memory.queued.miner;
        }
        if( memory.queued.hauler ){
            memory.queued.remoteHauler = memory.queued.hauler;
            delete memory.queued.hauler;
        }
        if( memory.queued.worker ){
            memory.queued.remoteWorker = memory.queued.worker;
            delete memory.queued.worker;
        }

        return memory;
    }, 
    spawn: (flag, type, fixedBody, multiBody) => {  
        // get nearest room
        let room = Room.bestSpawnRoomFor(flag.pos.roomName);
        if( room.controller.level < Task.mining.minControllerLevel ) return;
        // define new creep
        let name = `${type}-${flag.name}`;
        let creep = {
            parts: Creep.Setup.compileBody(room, fixedBody, multiBody, true),
            name: name,
            setup: type,
            destiny: { task: "mining", type: type, flagName: flag.name, room: flag.pos.roomName }
        };
        if( creep.parts.length === 0 ) {
            // creep has no body. 
            global.logSystem(flag.pos.roomName, dye(CRAYON.error, `Mining Flag tried to queue a zero parts body ${type}. Aborted.` ));
            return;
        }
        // queue creep for spawning
        room.spawnQueueLow.push(creep);
        // save queued creep to task memory
        let memory = Task.mining.memory(flag.pos.roomName);
        memory.queued[type].push({
            room: room.name,
            name: name
        });
    },
    creepBodies: {
        miner: {
            fixed: [MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK, CARRY],
            multi: []
        },
        hauler: {
            fixed: [CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, WORK],
            multi: [CARRY, CARRY, MOVE]
        },
        worker: {
            fixed: [MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, WORK, WORK, WORK],
            multi: []
        }
    },
    minControllerLevel: 4
};

module.exports = mod;
