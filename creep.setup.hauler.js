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
    if (spawn.room.situation.invasion) return 0;
    return (spawn.room.chargeablesOut.length > 0 || spawn.room.storage ) ? 2 : 0; 
};
setup.maxWeight = function(spawn){
    return 2000;
};
module.exports = setup;