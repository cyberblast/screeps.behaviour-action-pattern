// Defense task handles spotted invaders. Spawns defenders and gives them special behaviour.
module.exports = {
    // hook into events
    register: () => {
        // When a new invader has been spotted
        Room.newInvader.on( invaderCreep => Task.defense.handleNewInvader(invaderCreep) );
        // When an invader leaves a room
        Room.goneInvader.on( invaderId => Task.defense.handleGoneInvader(invaderId) );
        // a creep died
        Creep.died.on( creepName => Task.defense.handleCreepDied(creepName) );
    },
    // When a new invader has been spotted
    handleNewInvader: invaderCreep => {
        // check room threat balance
        if( invaderCreep.room.defenseLevel.sum > invaderCreep.room.hostileThreatLevel ) {
            // room can handle that
            return;
        } else {
            // order a defender for each invader (if not happened yet)
            invaderCreep.room.hostiles.forEach(Task.defense.orderDefenses);
        }
    },
    // When an invader leaves a room
    handleGoneInvader: invaderId => {
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
    },
    // when a creep died
    handleCreepDied: creepName => {        
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
    },
    // get task memory
    memory: invaderId => {
        return Task.memory('defense', invaderId);
    },
    // spawn defenses against an invader creep
    orderDefenses: invaderCreep => {
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
            // get spawning room and calculate defense creep
            let room = Game.rooms[Room.bestSpawnRoomFor(invaderCreep.pos.roomName)];
            let fixedBody = [RANGED_ATTACK, MOVE];
            let multiBody = [TOUGH, RANGED_ATTACK, RANGED_ATTACK, HEAL, MOVE, MOVE];
            let name = 'ranger-def';
            // TODO: Compile smaller body (only slightly bigger than remainingThreat)
            let body = Creep.Setup.compileBody(room, fixedBody, multiBody, true);
            let bodyThreat = Creep.bodyThreat(body);
            let orderId = global.guid();
            remainingThreat -= bodyThreat;

            let creep = {
                parts: body,
                name: name,
                behaviour: 'ranger',
                destiny: { 
                    task: "defense", 
                    invaderId: invaderId, 
                    spottedIn: invaderCreep.pos.roomName, 
                    order: orderId
                }
            };

            room.spawnQueueHigh.push(creep);
            taskMemory.defender.push({
                spawnRoom: room.name,
                threat: bodyThreat, 
                order: orderId
            });
            global.logSystem(room.name, `Defender queued for hostile creep ${invaderId}`);
        }
    },
    // define action assignment for defender creeps
    nextAction: creep => {
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
        if( invader )
            Creep.action.travelling.assign(creep, invader);
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
    }
};
