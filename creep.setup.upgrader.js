var setup = new Creep.Setup('upgrader');
setup.multiBody = [WORK, WORK, WORK, MOVE];
setup.fixedBody = [WORK, WORK, CARRY, MOVE];
setup.minAbsEnergyAvailable = 400;
setup.maxMulti = 4;
setup.minEnergyAvailable = function(spawn){
    return 0.5;
};
setup.maxCount = function(spawn){
    let container = spawn.room.containerOut;
    if (spawn.room.storage) container.push(spawn.room.storage);
    if (container.length > 0)
        return spawn.room.controller.pos.findInRange(container, 3 ) ? 1 : 0;
    else return 0;
};
setup.maxWeight = function(spawn){
    return null;
};
module.exports = setup;
