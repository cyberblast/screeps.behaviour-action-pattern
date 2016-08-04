require('global').init();
Extensions.extend();  
Creep.extend();  
Room.extend();  
Spawn.extend();  

module.exports.loop = function () {
    Room.loop();  
    Population.loop();  
    Creep.loop(); 
    Spawn.loop();
    Tower.loop();    
    Statistics.loop();
};