var setup = new Creep.Setup('hauler');
setup.multiBody = [CARRY, CARRY, MOVE];
setup.minControllerLevel = 2;
setup.minAbsEnergyAvailable = 150;
setup.maxMulti = function(room){ return 8; };
setup.sortedParts = false;
setup.minEnergyAvailable = function(spawn){
    return 0.4;
};
setup.maxCount = function(spawn){
    let count = 0;
    if(spawn.room.containerOut.length > 0 || spawn.room.storage || 
        (spawn.room.population && spawn.room.population.typeCount['miner'] && spawn.room.population.typeCount['miner'] > 0)) {
        count = 2;
        if( spawn.room.links.length > 2) count--;
        if( spawn.room.minerals.length > 0 ) count++;
    }
    return count; 
};
setup.maxWeight = function(spawn){
    return 2000;
};
module.exports = setup;