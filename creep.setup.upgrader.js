var setup = new Creep.Setup('upgrader');
setup.multiBody = [WORK];
setup.fixedBody = [WORK, CARRY, MOVE];
setup.minAbsEnergyAvailable = 200;
setup.maxMulti = 10;
setup.sortedParts = false;
setup.minEnergyAvailable = function(spawn){
    return 0.5;
};
setup.maxCount = function(spawn){
    return (spawn.room.chargeablesOut.length > 0 || spawn.room.controller ) ? 1 : 0;
};
setup.maxWeight = function(spawn){
    return null;
};
module.exports = setup;