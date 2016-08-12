var params = require('./parameter');
var global = require('./global')
global.init(params);
Extensions.extend();  
Creep.extend();  
Room.extend();  
Spawn.extend();  

module.exports.loop = function () {
    FlagDir.loop();
    Population.loop();  

    var roomLoop = room => {
        room.loop();
        Tower.loop(room);
    };
    _.forEach(Game.rooms, roomLoop);

    Creep.loop();

    if( Game.time % SPAWN_INTERVAL == 0 )   
        Spawn.loop(); 

    if( Game.time % TIME_REPORT == 0 ) 
        require('./statistics').loop();
};