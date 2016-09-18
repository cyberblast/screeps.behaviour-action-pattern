var setup = new Creep.Setup('miner');
setup.multiBody = [WORK];
setup.fixedBody = [WORK, CARRY, MOVE];
setup.minAbsEnergyAvailable = 200;
setup.maxMulti = function(room){ return 4; };
setup.sortedParts = false;
setup.minEnergyAvailable = function(spawn){
    return 0.3;
};
setup.maxCount = function(spawn){
    let miners = spawn.room.sources.length;
    if (spawn.room.minerals != null)
        miners = miners +1;
    
    return miners;
};
setup.maxWeight = function(spawn){
    return null;
};
module.exports = setup;
