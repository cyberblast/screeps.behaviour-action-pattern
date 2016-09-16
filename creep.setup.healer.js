var setup = new Creep.Setup('healer');
setup.multiBody = [MOVE, HEAL];
setup.minAbsEnergyAvailable = 300;
setup.maxMulti = function(room){ return 4; };
setup.globalMeasurement = true;
setup.minControllerLevel = 7;
setup.minEnergyAvailable = function(spawn){
    return 0.8;
}
setup.maxCount = function(spawn){
    return 0;//FlagDir.count(FLAG_COLOR.defense);
}
setup.maxWeight = function(spawn){
    return 0;
}
module.exports = setup;