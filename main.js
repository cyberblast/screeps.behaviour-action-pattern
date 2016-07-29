require('global').init();
require('creep').extend();

module.exports.loop = function () {
    MODULES.extensions.loop();  
    MODULES.population.loop();  
    MODULES.room.loop();  

    var run = creep => creep.run();
    _.forEach(Game.creeps, run);   

    if( Game.time % 10 == 0 ) 
        MODULES.spawn.loop();
    MODULES.tower.loop();
};