var setup = new Creep.Setup('privateer');
setup.multiBody = [WORK, CARRY, MOVE];
setup.fixedBody = [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
setup.minAbsEnergyAvailable = 400;
setup.maxMulti = 4;
setup.minControllerLevel = 3;
setup.globalMeasurement = true;
setup.sortedParts = false;
setup.minEnergyAvailable = function(spawn){
    return 0.8;
};
setup.maxWeight = function(spawn){
    return FlagDir.privateerMaxWeight(spawn);
    //return FlagDir.count(FLAG_COLOR.invade.exploit) * 3000;
}
module.exports = setup;