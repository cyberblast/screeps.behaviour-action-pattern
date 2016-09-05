var setup = new Creep.Setup('upgrader');
setup.multiBody = [WORK, WORK, WORK, WORK, MOVE];
setup.fixedBody = [WORK, WORK, CARRY, CARRY, MOVE];
setup.minAbsEnergyAvailable = 350;
setup.maxMulti = 4;
setup.minEnergyAvailable = function(spawn){
    return 0.5;
};
setup.maxCount = function(spawn){
    return spawn.room.controller.pos.findInRange(spawn.room.chargeablesOut.push(spawn.room.storage), 3 ) ? 1 : 0; 
};
setup.maxWeight = function(spawn){
    return null;
};
module.exports = setup;