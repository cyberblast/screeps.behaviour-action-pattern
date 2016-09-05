var setup = new Creep.Setup('ranger');
setup.multiBody = [RANGED_ATTACK, MOVE]; 
setup.minAbsEnergyAvailable = 200;
setup.maxMulti = 8;
setup.globalMeasurement = true;
setup.minControllerLevel = 5;
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