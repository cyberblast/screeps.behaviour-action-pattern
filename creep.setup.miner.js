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
    let miners = spawn.room.sources.length;
    let minerals = spawn.room.minerals;
    if ( minerals != null ) {
        let storege = spawn.room.storage;
        if ( storege != null && storege.store[minerals.mineralType] <= MINERALS_MAX_IN_STORE ) {
            miners = miners + 1;
        }
    }
    return miners;
};
setup.maxWeight = function(spawn){
    return null;
};
module.exports = setup;
