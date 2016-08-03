require('global').init();
Creep.extend();  
Room.extend();  
Extensions.extend();  
Spawn.extend();  

module.exports.loop = function () {
    Room.loop();  
    Population.loop();  
    Creep.loop(); 
    Spawn.loop();
    Tower.loop();    
    Statistics.loop();
};