/* https://github.com/ScreepsGamers/screeps.behaviour-action-pattern */ 

module.exports.loop = function () {
    var params = require('./parameter');
    var glob = require('./global');
    glob.init(params);
    if (Memory.modules === undefined) loadPaths();
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
};