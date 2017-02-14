// This task will react on Red/Cyan flags, sending a giant (RCL7 Req) claiming creep to the flags position.
let mod = {};
module.exports = mod;
// hook into events
mod.register = () => {
    // when a new flag has been found (occurs every tick, for each flag)
    Flag.found.on( flag => Task.attackController.handleFlagFound(flag) );
    // a creep starts spawning
    Creep.spawningStarted.on( params => Task.attackController.handleSpawningStarted(params) );
    // a creep completed spawning
    Creep.spawningCompleted.on( creep => Task.attackController.handleSpawningCompleted(creep) );
    // a creep will die soon
    Creep.predictedRenewal.on( creep => Task.attackController.handleCreepDied(creep.name) );
    // a creep died
    Creep.died.on( name => Task.attackController.handleCreepDied(name) );
};
// for each flag
mod.handleFlagFound = flag => {
    // if it is a Green/Purple flag
    if( flag.color == FLAG_COLOR.invade.attackController.color && flag.secondaryColor == FLAG_COLOR.invade.attackController.secondaryColor ){
        // check if a new creep has to be spawned
        
        Task.attackController.checkForRequiredCreeps(flag);
    }
};
// check if a new creep has to be spawned
mod.checkForRequiredCreeps = (flag) => {
    const roomName = flag.pos.roomName;
    const room = Game.rooms[roomName];
    // get task memory
    let memory = Task.attackController.memory(flag);
    // count creeps assigned to task
    let count = memory.queued.length + memory.spawning.length + memory.running.length;
    // if creep count below requirement spawn a new creep creep
    if( count < 1 ) {
        Task.spawn(            
            Task.attackController.creep.attackController, // creepDefinition
            { // destiny
                task: 'attackController', // taskName
                targetName: flag.name, // targetName
            }, 
            { // spawn room selection params
                targetRoom: flag.pos.roomName, 
                minEnergyCapacity: 3250
            },
            creepSetup => { // onQueued callback
                    memory.queued.push({
                    room: creepSetup.queueRoom,
                    name: creepSetup.name
                });
            }
        );
    }

};
// when a creep starts spawning
mod.handleSpawningStarted = params => { // params: {spawn: spawn.name, name: creep.name, destiny: creep.destiny}
    // ensure it is a creep which has been queued by this task (else return)
    if ( !params.destiny || !params.destiny.task || params.destiny.task != 'attackController' )
        return;
    // get flag which caused queueing of that creep
    let flag = Game.flags[params.destiny.flagName];
    if (flag) {
        // get task memory
        let memory = Task.attackController.memory(flag);
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
};
// when a creep completed spawning
mod.handleSpawningCompleted = creep => {
    // ensure it is a creep which has been requested by this task (else return)
    if (!creep.data || !creep.data.destiny || !creep.data.destiny.task || creep.data.destiny.task != 'attackController')
        return;
    // get flag which caused request of that creep
    let flag = Game.flags[creep.data.destiny.flagName];
    if (flag) {
        // calculate & set time required to spawn and send next substitute creep
        // TODO: implement better distance calculation
        creep.data.predictedRenewal = creep.data.spawningTime + (routeRange(creep.data.homeRoom, flag.pos.roomName)*50);

        // get task memory
        let memory = Task.attackController.memory(flag);
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
    if (!mem || !mem.destiny || !mem.destiny.task || mem.destiny.task != 'attackController')
        return;
    // get flag which caused request of that creep
    let flag = Game.flags[mem.destiny.flagName];
    if (flag) {
        // get task memory
        let memory = Task.attackController.memory(flag);
        // clean/validate task memory running creeps
        let running = []
        let validateRunning = o => {
            let creep = Game.creeps[o];
            // invalidate old creeps for predicted spawning
            // TODO: better distance calculation
            if( creep && creep.name != name && creep.data !== undefined && creep.data.spawningTime !== undefined && creep.ticksToLive > (creep.data.spawningTime + (routeRange(creep.data.homeRoom, flag.pos.roomName)*50) ) ) {
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
    if( !flag.memory.tasks.attackController ) {
        flag.memory.tasks.attackController = {
            queued: [], 
            spawning: [],
            running: []
        }
    }
    return flag.memory.tasks.attackController;
};
mod.nextAction = creep => {
    // override behaviours nextAction function
    // this could be a global approach to manipulate creep behaviour

    //Attack, then claim, then recycle
    let priority = [
        Creep.action.attackController,
        Creep.action.recycling
    ];
    for(var iAction = 0; iAction < priority.length; iAction++) {
        var action = priority[iAction];
        if(action.isValidAction(creep) &&
            action.isAddableAction(creep) &&
            action.assign(creep)) {
                return;
        }
    }
};
mod.creep = {
    attackController: {
        fixedBody: [CLAIM, MOVE,CLAIM, MOVE,CLAIM, MOVE,CLAIM, MOVE,CLAIM, MOVE],
        multiBody: [],
        name: "Atk-Contr", 
        behaviour: "claimer", 
        queue: "Low"
    },
};
