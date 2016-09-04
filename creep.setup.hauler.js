var setup = new Creep.Setup('hauler');
setup.multiBody = [CARRY, CARRY, MOVE];
setup.minControllerLevel = 2;
setup.minAbsEnergyAvailable = 150;
setup.maxMulti = 10;
setup.sortedParts = false;
setup.minEnergyAvailable = function(spawn){
    return 0.4;
};
setup.maxCount = function(spawn){
    return (spawn.room.chargeablesOut.length > 0 || spawn.room.storage ) ? 3 : 0; 
};
setup.maxWeight = function(spawn){
    return 3000;
};
module.exports = setup;