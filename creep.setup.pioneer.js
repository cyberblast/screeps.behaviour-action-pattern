var setup = new Creep.Setup('pioneer');
setup.multiBody = [CARRY, WORK, MOVE];
setup.fixedBody = [CARRY, WORK, MOVE, CARRY, WORK, MOVE];
setup.minAbsEnergyAvailable = 400;
setup.maxMulti = 4;
setup.minControllerLevel = 3;
setup.globalMeasurement = true;
setup.multiplicationPartwise = false;
setup.minEnergyAvailable = function(spawn){
    return 0.75;
};
setup.maxCount = function(spawn){
    return _.filter(Game.flags, FLAG_COLOR.claim.spawn.filter).length * 4;
};
setup.maxWeight = function(spawn){
    return null; // no evaluation
};
module.exports = setup;