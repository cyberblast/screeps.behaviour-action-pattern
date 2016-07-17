var setup = new MODULES.creep.Setup();

setup.type = 'worker';
setup.body = [CARRY, WORK, MOVE];
setup.defaultBodyCosts = 200;
setup.maxMulti = 6;
setup.minEnergyAvailable = function(){
    return 0.5;
}
setup.maxCount = function(spawn){
    return (spawn.room.sourceAccessibleFields + (spawn.room.sources.length*1.5));
}
setup.maxWeight = function(spawn){
    return (spawn.room.sources.length * 3000);
}

module.exports = setup;