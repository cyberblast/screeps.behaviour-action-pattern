require('global').init();
Extensions.extend();  
Creep.extend();  
Room.extend();  
Spawn.extend();  

module.exports.loop = function () {
    Population.loop();  
    var roomLoop = room => {
        room.loop();
        Tower.loop(room);
    };
    _.forEach(Game.rooms, roomLoop);

    Creep.loop(); 
    Spawn.loop(); 

    if( Game.time % TIME_REPORT == 0 ) 
        require('statistics').loop();
};