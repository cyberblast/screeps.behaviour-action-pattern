// useful commands

// Recycle a creep
Creep.action.recycling.assign(Game.creeps['<creepName>']);

// flush road construction traces
_.forEach(Memory.rooms, r => delete r.roadConstructionTrace);

// remove all construction Sites
_.forEach(Game.constructionSites, s => s.remove());

// spawn something...
Game.spawns['<spawnName>'].createCreepBySetup(Creep.setup.worker);
// or
Game.rooms['<roomName>'].spawnQueueLow.push({parts:[MOVE,WORK,CARRY],name:'max',setup:'worker'});
// or
Task.forceSpawn(Task.claim.creep.claimer, 'W0N0');
// or
Task.forceSpawn(Task.guard.creep.guard, {targetRoom: 'W0N0', allowTargetRoom: true}, 'Flag22');

// clear spawn queues for a room
// clear low priority queue
Memory.rooms['<roomName>'].spawnQueueLow = [0];
// clear medium priority queue
Memory.rooms['<roomName>'].spawnQueueMedium = [0];
// clear high priority queue 
Memory.rooms['<roomName>'].spawnQueueHigh = [0];

// check if a specific creep type is in queue
Util.inQueue('defender');
// or
Util.inQueue({behaviour: 'defender'});
// You can also limit by target room:
Util.inQueue({behaviour: 'remoteMiner', room: 'W0N0'});

// move Creep
Game.creeps['<creepName>'].move(RIGHT);

// force recycle a Creep
Game.creeps['<creepName>'].data.creepType="recycler";

// To override a module file create a copy of an existing module and name it "custom.<originalModuleName>". Then call this method (without ".js"): 
getPath('<originalModuleName>', true);
// To completely re-evaluate all modules:
delete Memory.modules;

// Safely wipe all Memory except creep role memory
_.forEach(Memory, (v, k) => !['population'].includes(k) && delete Memory[k]);

// create market order (replace [roomName] with target room or remove it for subscription tokens)
Game.market.createOrder(type, resourceType, price, totalAmount, roomName);

//accept market sell or buy order
Game.market.deal(orderId, amount, roomName);

//flush visuals heatmap
_.forEach(Memory.rooms, r => delete r.heatmap);

// https://github.com/ScreepsOCS/screeps.behaviour-action-pattern/wiki/Resource-Management
//resource management  - stat labs
Game.rooms['<roomName>'].placeReactionOrder('<labId>', '<resourceId>', '<amount>');

//resource management - maintain set amount in container
Game.rooms['<roomName>'].setStore('<structure>', '<resource>', '<amount>');

//resource management - one off amount in container
Game.rooms['<roomName>'].placeOrder('<structure>', '<resource>', '<amount>');

// Order all labs to store 2000 energy
_.values(Game.structures).filter(i=>i.structureType==='lab').map(i=>i.room.setStore(i.id, RESOURCE_ENERGY, 2000));

// Examine the low priority spawn queue in all rooms
_.chain(Game.spawns).values().map(i=>i.room).unique().filter(i=>i.spawnQueueLow.length).map(i=>[`====${i.name}====>`,i.spawnQueueLow.map(j=>j.name)]).value();

// Show histogram of remoteHauler weight
JSON.stringify(_.chain(Game.creeps).filter(i=>i.data.creepType==='remoteHauler').groupBy('data.weight').mapValues(i=>i.length))

// Shift all defense flags to a single room
FlagDir.filter(FLAG_COLOR.defense).map(i=>Game.flags[i.name]).map(i=>i.setPosition(new RoomPosition(i.pos.x, i.pos.y, '<roomName>')))
