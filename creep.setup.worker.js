var setup = new MODULES.creep.Setup();

setup.type = 'worker';
setup.multiBody = [CARRY, WORK, MOVE];
setup.fixedBody = [];
setup.minAbsEnergyAvailable = 200;
setup.maxMulti = 6;
setup.minEnergyAvailable = function(){
    return 0.5;
};
setup.maxCount = function(spawn){
    return (spawn.room.sourceAccessibleFields + (spawn.room.sources.length*2));
};
setup.maxWeight = function(spawn){
    return (spawn.room.sources.length * 3000);
};

module.exports = setup;