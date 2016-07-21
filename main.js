module.exports.loop = function () {
    require('global').init();
    MODULES.extensions.loop();  
    MODULES.population.loop();  
    MODULES.room.loop();  
    MODULES.creep.loop();        
    if( Game.time % 10 == 0 ) 
        MODULES.spawn.loop();
    MODULES.tower.loop();
};