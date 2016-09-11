var setup = new Creep.Setup('hauler');
setup.multiBody = [CARRY, CARRY, MOVE];
setup.minControllerLevel = 2;
setup.minAbsEnergyAvailable = 150;
setup.maxMulti = 7;
setup.sortedParts = false;
setup.minEnergyAvailable = function(spawn){
    return 0.4;
};
setup.maxCount = function(spawn){
    return (spawn.room.containerOut.length > 0 || spawn.room.storage || 
        (spawn.room.population && spawn.room.population.typeCount['miner'] && spawn.room.population.typeCount['miner'] > 0)) ? 2 : 0; 
};
setup.maxWeight = function(spawn){
    return 2000;
};
module.exports = setup;