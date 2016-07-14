module.exports.loop = function () {
    require('global').init();
    require('extensions').init();
    
    MODULES.creep.loop();        
    if( Game.time % 10 == 0 ) 
        MODULES.spawn.loop();
    MODULES.tower.loop();
};