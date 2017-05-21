// This task will react on robbing flags (invade/rob or red/yellow), sending 2 creeps to rob that room
let mod = {};
module.exports = mod;
mod.name = 'robbing';
// hook into events
mod.register = () => {};
// for each flag
mod.handleFlagFound = flag => {
    // if it is a robbing flag
    if (flag.compareTo(FLAG_COLOR.invade.robbing) && Task.nextCreepCheck(flag, mod.name)) {
        Util.set(flag.memory, 'task', mod.name);
        // check if a new creep has to be spawned
        Task.robbing.checkForRequiredCreeps(flag);
    }
};
// check if a new creep has to be spawned
mod.checkForRequiredCreeps = (flag) => {
    // get task memory
    let memory = Task.robbing.memory(flag);
    // re-validate if too much time has passed
    Task.validateAll(memory, flag, mod.name, {roomName: flag.pos.roomName, checkValid: true});
    // count creeps assigned to task
    const count = memory.queued.length + memory.spawning.length + memory.running.length;
    const roomName = flag.pos.roomName;
    
    // if creep count below requirement spawn a new creep creep 
    if( count < (memory.numRobbers || 2) ) {
        const spawnRoom = mod.strategies.robber.spawnRoom({roomName});
        if( !spawnRoom ) {
            return;
        }
        // robbers set homeRoom if closer storage exists
        const storageRoom = ROBBER_REHOME && (mod.strategies.robber.homeRoom(flag) || spawnRoom);
        Task.spawn(
            Task.robbing.creep.robbing, // creepDefinition
            { // destiny
                task: mod.name, // taskName
                targetName: flag.name, // targetName
                homeRoom: storageRoom.name
            }, 
            { // spawn room selection params
                targetRoom: roomName,
                explicit: spawnRoom.name,
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
        Task.validateQueued(memory, flag, mod.name);
    }
};
// when a creep completed spawning
mod.handleSpawningCompleted = creep => {
    // ensure it is a creep which has been requested by this task (else return)
    if (!creep.data || !creep.data.destiny || !creep.data.destiny.task || creep.data.destiny.task != 'robbing')
        return;
    if( creep.data.destiny.homeRoom ) {
        creep.data.homeRoom = creep.data.destiny.homeRoom;
    }
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
        Task.validateSpawning(memory, flag, mod.name);
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
        const memory = Task.robbing.memory(flag);
        Task.validateRunning(memory, flag, mod.name, {roomName: flag.pos.roomName, deadCreep: name});
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
            running: [],
            numRobbers: 2
        };
    }
    return flag.memory.tasks.robbing;
};
mod.nextAction = creep => {
    let carrySum = creep.sum;
    // at home
    if( creep.pos.roomName == creep.data.homeRoom ){
        // carrier filled
        if( carrySum > 0 ){
            if( DEBUG && TRACE ) trace('Task', {creepName:creep.name, pos:creep.pos, nextAction: 'storing?', robbing:'nextAction', Task:'robbing'});
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
            if (Creep.action.dropping.assign(creep)) return;
            Creep.behaviour.worker.nextAction(creep);
            return;
        }
        // empty
        // travelling
        if( Task[creep.data.destiny.task].exploitNextRoom(creep) ) {
            if( DEBUG && TRACE ) trace('Task', {creepName:creep.name, pos:creep.pos, nextAction: 'travelling', robbing:'nextAction', Task:'robbing'});
            return;
        } else {
            // no new flag
            // behave as worker
            if( DEBUG && TRACE ) trace('Task', {creepName:creep.name, pos:creep.pos, nextAction: 'working', robbing:'nextAction', Task:'robbing'});
            Creep.behaviour.worker.nextAction(creep);
            return;
        }
    }
    // not at home
    else {
        // at target room
        if( creep.flag && creep.flag.pos.roomName === creep.pos.roomName ){
            if( DEBUG && TRACE ) trace('Task', {creepName:creep.name, pos:creep.pos, nextAction: 'robbing', robbing:'nextAction', Task:'robbing'});
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
                mod.goHome(creep);
                return;
            }
        }
        // not at target room
        else {
            if( DEBUG && TRACE ) trace('Task', {creepName:creep.name, pos:creep.pos, nextAction: 'travelling2', robbing:'nextAction', Task:'robbing'});
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
        var flag;
        if( creep.data.destiny ) flag = Game.flags[creep.data.destiny.flagName];
        if( !flag ) flag = mod.getFlag(creep.data.homeRoom);
        // new flag found
        if( flag ) {
            return mod.gotoTargetRoom(creep, flag);
        }
    }
    // no new flag
    // go home
    return mod.goHome(creep);
};
mod.goHome = creep => {
    Population.registerCreepFlag(creep, null);
    Creep.action.travelling.assignRoom(creep, creep.data.homeRoom);
    return false;
};
mod.getFlag = function(roomName) {
    let validColor = flagEntry => (
        (flagEntry.color == FLAG_COLOR.invade.robbing.color && flagEntry.secondaryColor == FLAG_COLOR.invade.robbing.secondaryColor)
    );
    return FlagDir.find(validColor, new RoomPosition(25, 25, roomName), false);
};
mod.storage = function(roomName, storageRoom) {
    const memory = Task.robbing.memory(mod.getFlag(roomName));
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
mod.gotoTargetRoom = (creep, flag) => {
    if( Creep.action.travelling.assignRoom(creep, flag.pos.roomName) ) {
        Population.registerCreepFlag(creep, flag);
        return true;
    }
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
mod.strategies = {
    defaultStrategy: {
        name: `default-${mod.name}`,
    },
    robber: {
        name: `robber-${mod.name}`,
        homeRoom: function(flag) {
            // Explicity set by user?
            const memory = Task.robbing.memory(flag);
            if(memory.storageRoom) return Game.rooms[memory.storageRoom];
            // Otherwise, score it
            return Room.bestSpawnRoomFor(flag.pos.roomName);
        },
        spawnRoom: function({roomName, minWeight}) {
            return Room.findSpawnRoom({
                targetRoom: roomName,
                minEnergyCapacity: minWeight || 250,
            });
        },
    }
};
