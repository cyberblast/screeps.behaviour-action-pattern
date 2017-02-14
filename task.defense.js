// Defense task handles spotted invaders. Spawns defenders and gives them special behaviour.
let mod = {};
module.exports = mod;
// hook into events
mod.register = () => {
    // When a new invader has been spotted
    Room.newInvader.on( invaderCreep => Task.defense.handleNewInvader(invaderCreep) );
    // When an invader leaves a room
    Room.goneInvader.on( invaderId => Task.defense.handleGoneInvader(invaderId) );
    // a creep died
    Creep.died.on( creepName => Task.defense.handleCreepDied(creepName) );
};
// When a new invader has been spotted
mod.handleNewInvader = invaderCreep => {
    // ignore if on blacklist
    if( !SPAWN_DEFENSE_ON_ATTACK || DEFENSE_BLACKLIST.includes(invaderCreep.pos.roomName) ) return;
    // if not our room and not our reservation
    
    if( !invaderCreep.room.my && !invaderCreep.room.reserved ) {
        // if it is not our exploiting target
    let validColor = flagEntry => (
    (flagEntry.color == FLAG_COLOR.invade.exploit.color && flagEntry.secondaryColor == FLAG_COLOR.invade.exploit.secondaryColor) ||
    (flagEntry.color == FLAG_COLOR.claim.color )
    );
        let flag = FlagDir.find(validColor, invaderCreep.pos, true);
        
        if( !flag )
            return; // ignore invader
    } 
    // check room threat balance
    if( invaderCreep.room.defenseLevel.sum > invaderCreep.room.hostileThreatLevel ) {
        // room can handle that
        return;
    } else {
        // order a defender for each invader (if not happened yet)
        invaderCreep.room.hostiles.forEach(Task.defense.orderDefenses);            
    }
};
// When an invader leaves a room
mod.handleGoneInvader = invaderId => {
    // check if invader died or in an other room (requires vision)
    let invader = Game.getObjectById(invaderId);
    if( !invader ) { 
        // Invader not found anymore
        // remove queued creeps
        let taskMemory = Task.defense.memory(invaderId);
        if( taskMemory && taskMemory.defender ){
            let defender = [];
            let removeQueued = entry => {
                let roomMemory = Memory.rooms[entry.spawnRoom];
                if( roomMemory && roomMemory.spawnQueueHigh ){
                    let thisEntry = queued => queued.destiny && queued.destiny.task === 'defense' && queued.destiny.invaderId === invaderId;
                    let index = roomMemory.spawnQueueHigh.findIndex(thisEntry);
                    if( index > -1 ) roomMemory.spawnQueueHigh.splice(index, 1);
                }
            };
            taskMemory.defender.forEach(removeQueued);
        }

        // cleanup task memory
        Task.clearMemory('defense', invaderId);
        // other existing creeps will recycle themself via nextAction (see below)
    }
};
// when a creep died
mod.handleCreepDied = creepName => {     
    // check if its our creep
    let creepMemory = Memory.population[creepName];
    if (!creepMemory || !creepMemory.destiny || !creepMemory.destiny.task || creepMemory.destiny.task != 'defense' || !creepMemory.destiny.invaderId )
        return;
    // check if the invader is still there
    let invader = Game.getObjectById(creepMemory.destiny.invaderId);
    if( !invader ) 
        return;

    // remove died creep from mem
    let taskMemory = Task.defense.memory(creepMemory.destiny.invaderId);
    if( taskMemory.defender ) {
        let thisEntry = e => e.order === creepMemory.destiny.order;
        let index = taskMemory.defender.findIndex(thisEntry);
        if( index > -1 ) taskMemory.defender.splice(index, 1);
    }
    // order reinforements
    Task.defense.orderDefenses(invader);
};
// get task memory
mod.memory = invaderId => {
    return Task.memory('defense', invaderId);
};
mod.creep = {
    defender: {
        fixedBody: [RANGED_ATTACK, MOVE],
        multiBody: [TOUGH, RANGED_ATTACK, RANGED_ATTACK, HEAL, MOVE, MOVE],
        name: "defender", 
        behaviour: "ranger"
    },
};
// spawn defenses against an invader creep
mod.orderDefenses = invaderCreep => {
    let invaderId = invaderCreep.id;
    let remainingThreat = invaderCreep.threat;
    // check if an order has been made already
    let taskMemory = Task.defense.memory(invaderId);
    if( taskMemory.defender ) {
        // defender creeps found. get defender threat
        let getThreat = entry => remainingThreat -= entry.threat;
        taskMemory.defender.forEach(getThreat);
    } else {
        // No defender found.
        taskMemory.defender = [];
    }

    // analyze invader threat and create something bigger
    while( remainingThreat > 0 ){        
        let orderId = global.guid();
        Task.defense.creep.defender.queue = invaderCreep.room.my ? 'High' : 'Medium';
        Task.defense.creep.defender.minThreat = (remainingThreat * 1.1);
      
        let queued = Task.spawn(
            Task.defense.creep.defender, { // destiny
                task: 'defense', 
                targetName: invaderId,
                invaderId: invaderId, 
                spottedIn: invaderCreep.pos.roomName, 
                order: orderId
            }, { // spawn room selection params
                targetRoom: invaderCreep.pos.roomName, 
                maxRange: 4, 
                minEnergyCapacity: 800, 
                allowTargetRoom: true
            },
            creepSetup => { // callback onQueued
                let memory = Task.defense.memory(invaderId);
                memory.defender.push({
                    spawnRoom: creepSetup.queueRoom,
                    order: creepSetup.destiny.order
                });
                if( DEBUG ) global.logSystem(creepSetup.queueRoom, `Defender queued for hostile creep ${creepSetup.destiny.order} in ${creepSetup.destiny.spottedIn}`);
            }
        );

        if( queued ) {
            let bodyThreat = Creep.bodyThreat(queued.parts);
            remainingThreat -= bodyThreat;
        } else {
            // Can't spawn. Invader will not get handled!
            if( TRACE || DEBUG ) trace('Task', {task: 'defense', invaderId: invaderId, targetRoom: invaderCreep.pos.roomName}, 'Unable to spawn. Invader will not get handled!');
            return;
        }
    }
};
// define action assignment for defender creeps
mod.nextAction = creep => {
    // override behaviours nextAction function
    // this could be a global approach to manipulate creep behaviour

    // if spawning room is under attack defend there (=> defending)
    // if all invader gone, try to find original invaderById and travel there (=> travelling, defending)
    // else travel to ordering room (if no sight or invasion) (=> travelling, defending)
    // else check if there are other invaders nearby (=> travelling, defending)
    // if there is NO invader: recycle creep = travel to spawning room (or nearest), then recycling

    // defend current room
    if(Creep.action.defending.isValidAction(creep) &&
        Creep.action.defending.isAddableAction(creep) &&
        Creep.action.defending.assign(creep)) {
            return;
    }
    // travel to invader
    let invader = Game.getObjectById(creep.data.destiny.invaderId);
    if( invader ) {
        Creep.action.travelling.assign(creep, invader);
        return;
    }
    // travel to initial calling room
    let callingRoom = Game.rooms[creep.data.destiny.spottedIn];
    if( !callingRoom || callingRoom.hostiles.length > 0 ) {
        Creep.action.travelling.assign(creep, creep);
        creep.data.travelRoom = creep.data.destiny.spottedIn;
        return;
    }
    // check adjacent rooms for invasion
    let hasHostile = roomName => Game.rooms[roomName] && Game.rooms[roomName].hostiles.length > 0;
    let invasionRoom = creep.room.adjacentRooms.find(hasHostile);
    if( invasionRoom ) {
        Creep.action.travelling.assign(creep, creep);
        creep.data.travelRoom = invasionRoom;
        return;
    }
    // recycle self
    let mother = Game.spawns[creep.data.motherSpawn];
    if( mother ) {
        Creep.action.recycling.assign(creep, mother);
    }
};
