var setup = new Creep.Setup('upgrader');
setup.multiBody = [WORK, WORK, WORK, MOVE];
setup.fixedBody = [WORK, WORK, CARRY, MOVE];
setup.minAbsEnergyAvailable = 400;
setup.maxMulti = 4;
setup.minEnergyAvailable = function(spawn){
    return 0.5;
};
setup.maxCount = function(spawn){
    return spawn.room.containerController ? 1 : 0;
};
setup.maxWeight = function(spawn){
    return null;
};
module.exports = setup;
