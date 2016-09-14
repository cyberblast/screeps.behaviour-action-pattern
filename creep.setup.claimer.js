var setup = new Creep.Setup('claimer');
setup.multiBody = [CLAIM, MOVE];
setup.fixedBody = [CLAIM, MOVE, CLAIM, MOVE];
setup.minAbsEnergyAvailable = 1300;
setup.maxMulti = 0;
setup.minControllerLevel = 3;
setup.globalMeasurement = true;
setup.measureByHome = true;
setup.sortedParts = true;
setup.minEnergyAvailable = function(spawn){
    return 0.6;
}
setup.maxWeight = function(spawn){
    return spawn.room.claimerMaxWeight;
}
module.exports = setup;
