/* https://github.com/ScreepsGamers/screeps.behaviour-action-pattern */ 

module.exports.loop = function () {
    var params = require('./parameter');
    var glob = require('./global');
    glob.init(params);
    Extensions.extend();  
    Creep.extend();  
    Room.extend();  
    Spawn.extend();
    FlagDir.extend();

    FlagDir.loop();
    Population.loop();

    var roomLoop = room => {
        room.loop();
        Tower.loop(room);
    };
    _.forEach(Game.rooms, roomLoop);

    Creep.loop();   
    Spawn.loop(); 

    if( Memory.statistics && Memory.statistics.tick && Memory.statistics.tick + TIME_REPORT <= Game.time )
        require('./statistics').loop();
    processReports();

    // uncomment for 1 loop to flush road construction traces
    //_.forEach(Memory.rooms, r => delete r.roadConstructionTrace);

    // uncomment for 1 loop toremove all construction Sites
    //_.forEach(Game.constructionSites, s => s.remove());
};

// use in console to spawn something...
// Game.spawns['Spawn15'].createCreepBySetup(Creep.setup.worker)

// move Creep
// Game.creeps['ranger-900-1'].move(RIGHT)

// Game.rooms['W44N3'].spawnQueueHigh.push({parts:[MOVE],name:'max',setup:'Healer',cost:50})