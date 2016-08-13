var setup = new Creep.Setup('privateer');
setup.multiBody = [CARRY, WORK, MOVE];
setup.fixedBody = [CARRY, WORK, MOVE, CARRY, WORK, MOVE];
setup.minAbsEnergyAvailable = 400;
setup.maxMulti = 4;
setup.minControllerLevel = 2;
setup.globalMeasurement = true;
setup.multiplicationPartwise = false;
setup.minEnergyAvailable = function(spawn){
    return 0.8;
};
setup.maxWeight = function(spawn){
    return FlagDir.count(FLAG_COLOR.invade.exploit) * 4000;
}
module.exports = setup;