var setup = new Creep.Setup('miner');
setup.minControllerLevel = 3;
setup.multiBody = [WORK];
setup.fixedBody = [WORK, CARRY, MOVE];
setup.minAbsEnergyAvailable = 200;
setup.maxMulti = function(room){ return 4; };
setup.sortedParts = false;
setup.minEnergyAvailable = function(spawn){
    return 0.3;
};
setup.maxCount = function(spawn){
    return spawn.room.sources.length;
};
setup.maxWeight = function(spawn){
    return null;
};
module.exports = setup;