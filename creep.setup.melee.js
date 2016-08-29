var setup = new Creep.Setup('melee');
setup.multiBody = [TOUGH, MOVE, TOUGH, MOVE, ATTACK, MOVE]; 
setup.minAbsEnergyAvailable = 250;
setup.maxMulti = 4;
setup.globalMeasurement = true;
setup.minControllerLevel = 2;
setup.minEnergyAvailable = function(spawn){
    return 0.8;
};
setup.maxCount = function(spawn){
    return FlagDir.count(FLAG_COLOR.defense);
};
setup.maxWeight = function(spawn){
    return null;
};
module.exports = setup;