require('global').init();
require('creep').extend();

module.exports.loop = function () {
    MODULES.extensions.loop();  
    MODULES.room.loop();  
    MODULES.population.loop();  

    var run = creep => creep.run();
    _.forEach(Game.creeps, run);   

    if( Game.time % 10 == 0 ) 
        MODULES.spawn.loop();
    MODULES.tower.loop();
    
    MODULES.statistics.loop();
};