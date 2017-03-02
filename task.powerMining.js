let mod = {};
module.exports = mod;
mod.minControllerLevel = 7;
mod.name = 'powerMining';
mod.register = () => {
    // when a new flag has been found (occurs every tick, for each flag)
    Flag.found.on( flag => Task.powerMining.handleFlagFound(flag) );
    // when a flag has been removed
    Flag.FlagRemoved.on( flagName => Task.powerMining.handleFlagRemoved(flagName) );
    // a creep starts spawning
    Creep.spawningStarted.on( params => Task.powerMining.handleSpawningStarted(params) );
    Creep.spawningCompleted.on( creep => Task.powerMining.handleSpawningCompleted(creep) );
    Creep.died.on( name => Task.powerMining.handleCreepDied(name));
};
mod.checkFlag = (flag) => {
    if( flag.color == FLAG_COLOR.invade.powerMining.color && flag.secondaryColor == FLAG_COLOR.invade.powerMining.secondaryColor ) {
        flag.memory.roomName = flag.pos.roomName;
        flag.memory.task = mod.name;
        return true;
    }
    return false;
};
mod.handleFlagRemoved = flagName => {
    // check flag
    const flagMem = Memory.flags[flagName];
    if( flagMem && flagMem.task === mod.name && flagMem.roomName ){
        // if there is still a powerMining flag in that room ignore. 
        const flags = FlagDir.filter(FLAG_COLOR.invade.powerMining, new RoomPosition(25,25,flagMem.roomName), true);
        if( flags && flags.length > 0 ) 
            return;
        else {
            // no more powerMining in that room. 
            // clear memory
            Task.clearMemory(mod.name, flagMem.roomName);
        }
    }
};
mod.handleFlagFound = flag => {
    // Analyze Flag
    if( Task.powerMining.checkFlag(flag) ){
        // check if a new creep has to be spawned
        Task.powerMining.checkForRequiredCreeps(flag);
    }
};
// remove creep from task memory of queued creeps
mod.handleSpawningStarted = params => {
    if ( !params.destiny || !params.destiny.task || params.destiny.task != mod.name )
        return;
    const memory = Task.powerMining.memory(params.destiny.room);
    if( memory.queued[params.destiny.type] ) memory.queued[params.destiny.type].pop();
    else if( params.destiny.role ) {
        // temporary migration
        if( params.destiny.role == "powerHauler" ) params.destiny.type = 'powerHauler';
        else if( params.destiny.role == "powerMiner" ) params.destiny.type = 'powerMiner';
        else if( params.destiny.role == "powerHealer" ) params.destiny.type = 'powerHealer';
        memory.queued[params.destiny.type].pop();
    }
    if (params.body) params.body = _.countBy(params.body);
    // save spawning creep to task memory
    memory.spawning[params.destiny.type].push(params);
    // set a timer to make sure we re-validate this spawning entry if it still remains after the creep has spawned
    const nextCheck = memory.nextSpawnCheck[params.destiny.type];
    if (!nextCheck || (Game.time + params.spawnTime) < nextCheck) memory.nextSpawnCheck[params.destiny.type] = Game.time + params.spawnTime + 1;
};
mod.validateSpawning = (roomName, type) => {
    const memory = Task.powerMining.memory(roomName);
    let spawning = [];
    let minRemaining;
    let _validateSpawning = o => {
        let spawn = Game.spawns[o.spawn];
        if( spawn && ((spawn.spawning && spawn.spawning.name == o.name) || (spawn.newSpawn && spawn.newSpawn.name == o.name))) {
            minRemaining = (!minRemaining || spawn.spawning.remainingTime < minRemaining) ? spawn.spawning.remainingTime : minRemaining;
            spawning.push(o);
        }
    };
    if (memory.spawning[type]) {
        memory.spawning[type].forEach(_validateSpawning);
    }
    memory.spawning[type] = spawning;
    // if we get to this tick without nextCheck getting updated (by handleSpawningCompleted) we need to validate again, it might be stuck.
    memory.nextSpawnCheck[type] = minRemaining ? Game.time + minRemaining : 0;
};
mod.handleSpawningCompleted = creep => {
    if ( !creep.data.destiny || !creep.data.destiny.task || creep.data.destiny.task != mod.name )
        return;
    if( creep.data.destiny.homeRoom ) {
        creep.data.homeRoom = creep.data.destiny.homeRoom;
    }
    // calculate & set time required to spawn and send next substitute creep
    // TODO: implement better distance calculation
    creep.data.predictedRenewal = creep.data.spawningTime + (routeRange(creep.data.homeRoom, creep.data.destiny.room)*50);
    // get task memory
    const memory = Task.powerMining.memory(creep.data.destiny.room);
    // save running creep to task memory
    memory.running[creep.data.destiny.type].push(creep.name);
    // clean/validate task memory spawning creeps
    Task.powerMining.validateSpawning(creep.data.destiny.room, creep.data.destiny.type);
};
mod.validateRunning = (roomName, type, name) => {
    // get task memory
    let memory = Task.powerMining.memory(roomName);
    let running = [];
    let _validateRunning = o => {
        // invalidate dead or old creeps for predicted spawning
        let creep = Game.creeps[o];
        if( !creep || !creep.data ) return;
        // invalidate old creeps for predicted spawning
        // TODO: better distance calculation
        let prediction;
        if( creep.data.predictedRenewal ) prediction = creep.data.predictedRenewal;
        else if( creep.data.spawningTime ) prediction = (creep.data.spawningTime + (routeRange(creep.data.homeRoom, roomName)*50));
        else prediction = (routeRange(creep.data.homeRoom, roomName)+1) * 50;
        if( ( !name || creep.name !== name ) && creep.ticksToLive > prediction ) running.push(o);
    };
    if( memory.running[type] ) {
        memory.running[type].forEach(_validateRunning);
    }
    memory.running[type] = running;
};
// when a creep died (or will die soon)
mod.handleCreepDied = name => {
    // get creep memory
    let mem = Memory.population[name];
    // ensure it is a creep which has been requested by this task (else return)
    if (!mem || !mem.destiny || !mem.destiny.task || mem.destiny.task != mod.name)
        return;
    // clean/validate task memory running creeps
    Task.powerMining.validateRunning(mem.destiny.room, mem.creepType, name);
};
mod.needsReplacement = (creep) => {
    // (c.ticksToLive || CREEP_LIFE_TIME) < (50 * travel - 40 + c.data.spawningTime)
    return !creep || (creep.ticksToLive || CREEP_LIFE_TIME) < (creep.data.predictedRenewal || 0);
};
// check if a new creep has to be spawned
mod.checkForRequiredCreeps = (flag) => {
    const roomName = flag.pos.roomName;
    const room = Game.rooms[roomName];
    // Use the roomName as key in Task.memory?
    // Prevents accidentally processing same room multiple times if flags > 1
    let memory = Task.powerMining.memory(roomName);

    let trainCount = 1;
   
    // do we need to validate our spawning entries?
    for (const type of ['powerHauler', 'powerMiner', 'powerHealer']) {
        if (memory.nextSpawnCheck[type] && Game.time > memory.nextSpawnCheck[type]) {
            if( DEBUG && TRACE ) trace('Task', {Task:mod.name, roomName, flagName:flag.name, [mod.name]:'Flag.found', 'Flag.found':'revalidating', revalidating:type});
            Task.powerMining.validateSpawning(roomName, type);
        }
    }

    let countExisting = type => {
        let invalidEntry = false;
        let running = _.map(memory.running[type], n => {
            let c = Game.creeps[n];
            if (!c) invalidEntry = true;
            return c;
        });
        if (invalidEntry) {
            if( DEBUG && TRACE ) trace('Task', {Task:mod.name, roomName, flagName:flag.name, [mod.name]:'Flag.found', 'Flag.found':'revalidating', revalidating:type});
            mod.validateRunning(roomName, type);
            running = _.map(memory.running[type], n => Game.creeps[n]);
        }
        let runningCount = _.filter(running, c => !Task.powerMining.needsReplacement(c)).length;
        return memory.queued[type].length + memory.spawning[type].length + runningCount;
    };

    let haulerCount = countExisting('powerHauler');
    let minerCount = countExisting('powerMiner');
    let healerCount = countExisting('powerHealer');

   // console.log('haul '+haulerCount + ' miner ' + minerCount+' healer '+healerCount)
    if( DEBUG && TRACE ) trace('Task', {Task:mod.name, flagName:flag.name, trainCount, haulerCount, minerCount, healerCount, [mod.name]:'Flag.found'}, 'checking flag@', flag.pos);


    if(minerCount < trainCount) {
        if( DEBUG && TRACE ) trace('Task', {Task:mod.name, room:roomName, minerCount,
            minerTTLs: _.map(_.map(memory.running.powerMiner, n=>Game.creeps[n]), "ticksToLive"), [mod.name]:'minerCount'});

        for(let i = minerCount; i < trainCount; i++) {
            Task.spawn(
                Task.powerMining.creep.miner, // creepDefinition
                { // destiny
                    task: mod.name, // taskName
                    targetName: flag.name, // targetName
                    type: Task.powerMining.creep.miner.behaviour // custom
                }, 
                { // spawn room selection params
                    targetRoom: roomName,
                    minEnergyCapacity: 3000,
                    rangeRclRatio: 1,
                },
                creepSetup => { // onQueued callback
                    let memory = Task.powerMining.memory(creepSetup.destiny.room);
                    memory.queued[creepSetup.behaviour].push({
                        room: creepSetup.queueRoom,
                        name: creepSetup.name
                    });
                }
            );
        }
    }
    //spawn 2 healers after powerMiner queued 
    let maxHealers = minerCount * 2;
    if(healerCount < maxHealers ) {
        for(let i = healerCount; i < maxHealers; i++) {
            Task.spawn(
                Task.powerMining.creep.healer, // creepDefinition
                { // destiny
                    task: mod.name, // taskName
                    targetName: flag.name, // targetName
                    type: Task.powerMining.creep.healer.behaviour // custom
                }, 
                { // spawn room selection params
                    targetRoom: roomName,
                    minEnergyCapacity: 3000
                },
                creepSetup => { // onQueued callback
                    let memory = Task.powerMining.memory(creepSetup.destiny.room);
                    memory.queued[creepSetup.behaviour].push({
                        room: creepSetup.queueRoom,
                        name: creepSetup.name
                    });
                }
            );
        }
    }

    // only spawn haulers when powerbank hits are lower than 650k
    // (flag && flag.room.powerBank && flag.room.powerBank.hits < 100000)
    if (!flag.room || !flag.room.powerBank) return;
    if(flag.room){
    	 let maxHaulers = Math.round(flag.room.powerBank.power / 1250);
        if((POWER_MINE_LOG && Game.time % 20 == 0) || room.name == 'sim'){
            console.log('Power Mining - Target: '+flag+' | '+flag.pos.roomName+' | Power: '+flag.room.powerBank.power+ ' | Hits Left: '+flag.room.powerBank.hits+' Haulers: '+haulerCount+'/'+maxHaulers+' Time left: '+flag.room.powerBank.ticksToDecay)
        }
    if(haulerCount < maxHaulers && (flag && flag.room.powerBank && flag.room.powerBank.hits < 400000)) {
        for(let i = haulerCount; i < maxHaulers; i++) {
            const spawnRoom = mod.strategies.hauler.spawnRoom(roomName);
            if( !spawnRoom ) break;

            const storageRoom = mod.strategies.hauler.spawnRoom(roomName) || spawnRoom;

            // spawning a new hauler
            const creepDefinition = _.create(Task.powerMining.creep.hauler);
                Task.spawn(
                creepDefinition,
                { // destiny
                    task: mod.name, // taskName
                    targetName: flag.name, // targetName
                    type: Task.powerMining.creep.hauler.behaviour, // custom
                    homeRoom: storageRoom.name
                }, {
                    targetRoom: roomName,
                    explicit: spawnRoom.name,
                },
                creepSetup => { // onQueued callback
                    let memory = Task.powerMining.memory(creepSetup.destiny.room);
                    memory.queued[creepSetup.behaviour].push({
                        room: creepSetup.queueRoom,
                        name: creepSetup.name,
                        body: _.countBy(creepSetup.parts)
                    });
                }
            );
        }
    }}    
};
mod.findSpawning = (roomName, type) => {
    let spawning = [];
    _.forEach(Game.spawns, s => {
        if (s.spawning && (_.includes(s.spawning.name, type) || (s.newSpawn && _.includes(s.newSpawn.name, type)))) {
            let c = Population.getCreep(s.spawning.name);
            if (c && c.destiny.room === roomName) {
                let params = {
                    spawn: s.name,
                    name: s.spawning.name,
                    destiny: c.destiny
                };
                spawning.push(params);
            }
        }
    });
    return spawning;
};
mod.findRunning = (roomName, type) => {
    let running = [];
    _.forEach(Game.creeps, c => {
        if (!c.spawning && c.data.creepType === type && c.data && c.data.destiny && c.data.destiny.room === roomName) {
            running.push(c.name);
        }
    });
    return running;
};
mod.memory = key => {
    let memory = Task.memory(mod.name, key);
    if( !memory.hasOwnProperty('queued') ){
        memory.queued = {
            powerMiner:[],
            powerHauler:[],
            powerHealer:[]
        };
    }
    if( !memory.hasOwnProperty('spawning') ){
        memory.spawning = {
            powerMiner: Task.powerMining.findSpawning(key, 'powerMiner'),
            powerHauler: Task.powerMining.findSpawning(key, 'powerHauler'),
            powerHealer: Task.powerMining.findSpawning(key, 'powerHealer')
        };
    }
    if( !memory.hasOwnProperty('running') ){
        memory.running = {
            powerMiner: Task.powerMining.findRunning(key, 'powerMiner'),
            powerHauler: Task.powerMining.findRunning(key, 'powerHauler'),
            powerHealer: Task.powerMining.findRunning(key, 'powerHealer')
        };
    }
    if( !memory.hasOwnProperty('nextSpawnCheck') ){
        memory.nextSpawnCheck = {};
    }
    // temporary migration
    if( memory.queued.miner ){
        memory.queued.powerMiner = memory.queued.miner;
        delete memory.queued.miner;
    }
    if( memory.queued.hauler ){
        memory.queued.powerHauler = memory.queued.hauler;
        delete memory.queued.hauler;
    }
    if( memory.queued.healer ){
        memory.queued.powerHealer = memory.queued.healer;
        delete memory.queued.healer;
    }

    return memory;
};
mod.creep = {
    miner: {
        fixedBody: [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, MOVE],
        sort: false,
        multiBody: [],
        maxMulti: 24,
        behaviour: 'powerMiner',
        queue: 'Medium' // power needs to be high ish priority as there is a time limit.
    },
    hauler: {
        fixedBody: [CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE],
        multiBody: [],
        behaviour: 'powerHauler',
        queue: 'Medium'
    },
    healer: {
        fixedBody: [MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL],
        multiBody: [], 
        behaviour: 'powerHealer',
        queue: 'Medium'
    }
};

mod.storage = function(roomName, storageRoom) {
    const room = Game.rooms[roomName];
    let memory = Task.powerMining.memory(roomName);
    if (storageRoom) {
        const was = memory.storageRoom;
        memory.storageRoom = storageRoom;
        return `Task.${mod.name}: room ${roomName}, now sending haulers to ${storageRoom}, (was ${was})`;
    } else if (!memory.storageRoom) {
        return `Task.${mod.name}: room ${roomName}, no custom storage destination`;
    } else if (storageRoom === false) {
        const was = memory.storageRoom;
        delete memory.storageRoom;
        return `Task.${mod.name}: room ${roomName}, cleared custom storage room (was ${was})`;
    } else {
        return `Task.${mod.name}: room ${roomName}, sending haulers to ${memory.storageRoom}`;
    }
};

mod.strategies = {
    defaultStrategy: {
        name: `default-${mod.name}`,
    },
    hauler: {
        name: `hauler-${mod.name}`,
        homeRoom: function(flagRoomName) {
            // Explicity set by user?
            let memory = Task.powerMining.memory(flagRoomName);
            if(memory.storageRoom) return Game.rooms[memory.storageRoom];
            // Otherwise, score it
            return Room.bestSpawnRoomFor(flagRoomName);
        },
        spawnRoom: function(flagRoomName) {
            return Room.findSpawnRoom({
                targetRoom: flagRoomName,
                minEnergyCapacity: 1500
            });
        },
        
    },
};
