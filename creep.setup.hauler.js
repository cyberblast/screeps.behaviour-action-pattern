var setup = new Creep.Setup('hauler');
setup.multiBody = [CARRY, CARRY, MOVE];
setup.minControllerLevel = 2;
setup.minAbsEnergyAvailable = 150;
setup.maxMulti = function(room){
    let max = 7; 
    if( room.minerals.length > 0 ) 
        max += 3; 
    let contSum = _.sum(room.containerIn.map(e => _.sum(e.store)));
    max += Math.floor(contSum / 1000);
    return max;
};
setup.sortedParts = false;
setup.minEnergyAvailable = function(spawn){
    return 0.4;
};
setup.maxCount = function(spawn){
    let count = 0;
    if(spawn.room.containerOut.length > 0 || spawn.room.storage || 
        (spawn.room.population && spawn.room.population.typeCount['miner'] && spawn.room.population.typeCount['miner'] > 0)) {
        if( spawn.room.links.length > 2) count = 1;
        else count = 2;
    }
    return count; 
};
setup.maxWeight = function(spawn){
    return 2000;
};
module.exports = setup;