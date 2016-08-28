var setup = new Creep.Setup('healer');
setup.multiBody = [MOVE, HEAL];
setup.minAbsEnergyAvailable = 300;
setup.maxMulti = 1;
setup.globalMeasurement = true;
setup.minControllerLevel = 7;
setup.minEnergyAvailable = function(spawn){
    return 0.8;
}
setup.maxCount = function(spawn){
    return FlagDir.count(FLAG_COLOR.defense);
}
setup.maxWeight = function(spawn){
    return null;
}
module.exports = setup;