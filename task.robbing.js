// This task will react on robbing flags (invade/rob or red/yellow), sending 2 creeps to rob that room
let mod = {};
module.exports = mod;
// hook into events
mod.register = () => {
    // when a new flag has been found (occurs every tick, for each flag)
    Flag.found.on( flag => Task.robbing.handleFlagFound(flag) );
    // a creep starts spawning
    Creep.spawningStarted.on( params => Task.robbing.handleSpawningStarted(params) );
    // a creep completed spawning
    Creep.spawningCompleted.on( creep => Task.robbing.handleSpawningCompleted(creep) );
    // a creep will die soon
    Creep.predictedRenewal.on( creep => Task.robbing.handleCreepDied(creep.name) );
    // a creep died
    Creep.died.on( name => Task.robbing.handleCreepDied(name) );
};
// for each flag
mod.handleFlagFound = flag => {
    // if it is a robbing flag
    if( flag.color == FLAG_COLOR.invade.robbing.color && flag.secondaryColor == FLAG_COLOR.invade.robbing.secondaryColor){
        // check if a new creep has to be spawned
        Task.robbing.checkForRequiredCreeps(flag);
    }
};
// check if a new creep has to be spawned
mod.checkForRequiredCreeps = (flag) => {
    // get task memory
    let memory = Task.robbing.memory(flag);
    // count creeps assigned to task

    let count = memory.queued.length + memory.spawning.length + memory.running.length;
    
    // if creep count below requirement spawn a new creep creep 
    if( count < 2 ) {
        Task.spawn(
            Task.robbing.creep.robbing, // creepDefinition
            { // destiny
                task: 'robbing', // taskName
                targetName: flag.name, // targetName
            }, 
            { // spawn room selection params
                targetRoom: flag.pos.roomName, 
                minEnergyCapacity: 250
            },
            creepSetup => { // callback onQueued
                let memory = Task.robbing.memory(Game.flags[creepSetup.destiny.targetName]);
                memory.queued.push({
                    room: creepSetup.queueRoom,
                    name: creepSetup.name
            });
        });
    }
};
// when a creep starts spawning
mod.handleSpawningStarted = params => { // params: {spawn: spawn.name, name: creep.name, destiny: creep.destiny}
    // ensure it is a creep which has been queued by this task (else return)
    if ( !params.destiny || !params.destiny.task || params.destiny.task != 'robbing' )
        return;
    // get flag which caused queueing of that creep
    // TODO: remove  || creep.data.destiny.flagName (temporary backward compatibility)
    let flag = Game.flags[params.destiny.targetName || params.destiny.flagName];
    if (flag) {
        // get task memory
        let memory = Task.robbing.memory(flag);
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
    if (!creep.data || !creep.data.destiny || !creep.data.destiny.task || creep.data.destiny.task != 'robbing')
        return;
    // get flag which caused request of that creep
    // TODO: remove  || creep.data.destiny.flagName (temporary backward compatibility)
    let flag = Game.flags[creep.data.destiny.targetName || creep.data.destiny.flagName];
    if (flag) {
        // calculate & set time required to spawn and send next substitute creep
        // TODO: implement better distance calculation
        creep.data.predictedRenewal = creep.data.spawningTime + (routeRange(creep.data.homeRoom, flag.pos.roomName)*50);

        // get task memory
        let memory = Task.robbing.memory(flag);
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
};
// when a creep died (or will die soon)
mod.handleCreepDied = name => {
    // get creep memory
    let mem = Memory.population[name];
    // ensure it is a creep which has been requested by this task (else return)
    if (!mem || !mem.destiny || !mem.destiny.task || mem.destiny.task != 'robbing')
        return;
    // get flag which caused request of that creep
    // TODO: remove  || creep.data.destiny.flagName (temporary backward compatibility)
    let flag = Game.flags[mem.destiny.targetName || mem.destiny.flagName];
    if (flag) {
        // get task memory
        let memory = Task.robbing.memory(flag);
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
};
// get task memory
mod.memory = (flag) => {
    if( !flag.memory.tasks ) 
        flag.memory.tasks = {};
    if( !flag.memory.tasks.robbing ) {
        flag.memory.tasks.robbing = {
            queued: [], 
            spawning: [],
            running: []
        }
    }
    return flag.memory.tasks.robbing;
};
mod.nextAction = creep => {
    let carrySum = creep.sum;
    // at home
    if( creep.pos.roomName == creep.data.homeRoom ){
        // carrier filled
        if( carrySum > 0 ){
            let deposit = []; // deposit energy in...
            // links?
            if( creep.carry.energy == carrySum ) deposit = creep.room.structures.links.privateers;
            // storage?
            if( creep.room.storage ) deposit.push(creep.room.storage);
            // containers?
            if( creep.room.structures.container ) deposit = deposit.concat( creep.room.structures.container.privateers );
            // Choose the closest
            if( deposit.length > 0 ){
                let target = creep.pos.findClosestByRange(deposit);
                if( target.structureType == STRUCTURE_STORAGE && Creep.action.storing.assign(creep, target) ) return;
                else if(Creep.action.charging.assign(creep, target) ) return;
            }
            //if( Creep.action.storing.assign(creep) ) return;
            if( Creep.action.charging.assign(creep) ) return;
            if( !creep.room.ally && Creep.action.storing.assign(creep) ) return;
            Creep.behaviour.worker.nextAction(creep);
            return;
        }
        // empty
        // travelling
        if( Task[creep.data.destiny.task].exploitNextRoom(creep) )
            return;
        else {
            // no new flag
            // behave as worker
            Creep.behaviour.worker.nextAction(creep);
            return;
        }
    }
    // not at home
    else {
        // at target room
        if( creep.data.destiny.room == creep.pos.roomName ){

            // get some energy
            if( creep.sum < creep.carryCapacity*0.4 ) {
                // harvesting or picking
                var actions = [
                    Creep.action.picking,
                    Creep.action.robbing
                ];
                for(var iAction = 0; iAction < actions.length; iAction++) {
                    var action = actions[iAction];
                    if(action.isValidAction(creep) &&
                        action.isAddableAction(creep) &&
                        action.assign(creep))
                        return;
                }
                // no targets in current room
                if (creep.flag) {
                    creep.flag.cloaking = 50;
                }
                Task[creep.data.destiny.task].exploitNextRoom(creep);
                return;
            }
            // carrier full
            else {
                Population.registerCreepFlag(creep, null);
                Creep.action.travelling.assign(creep, Game.rooms[creep.data.homeRoom].controller);
                return;
            }
        }
        // not at target room
        else {
            Task[creep.data.destiny.task].exploitNextRoom(creep);
            return;
        }
    }
    // fallback
    Creep.action.recycling.assign(creep);
};
mod.exploitNextRoom = creep => {
    if( creep.sum < creep.carryCapacity*0.4 ) {
        // calc by distance to home room
        let validColor = flagEntry => (
            (flagEntry.color == FLAG_COLOR.invade.robbing.color && flagEntry.secondaryColor == FLAG_COLOR.invade.robbing.secondaryColor)
        );
        var flag;
        if( creep.data.destiny ) flag = Game.flags[creep.data.destiny.flagName];
        if( !flag ) flag = FlagDir.find(validColor, Game.rooms[creep.data.homeRoom].controller.pos, false);
        // new flag found
        if( flag ) {
            // travelling
            if( Creep.action.travelling.assign(creep, flag) ) {
                Population.registerCreepFlag(creep, flag);
                return true;
            }
        }
    }
    // no new flag
    // go home
    Population.registerCreepFlag(creep, null);
    Creep.action.travelling.assign(creep, Game.rooms[creep.data.homeRoom].controller);
    return false;
};
mod.creep = {
    robbing: {
        fixedBody: [WORK, CARRY, MOVE, MOVE],
        multiBody: [CARRY, MOVE],
        name: "robber", 
        behaviour: "privateer", 
        queue: 'Low'
    },
};
