var setup = _.cloneDeep(require('creep.setup'));

setup.type = 'worker';
setup.body = [CARRY, WORK, MOVE];
setup.defaultBodyCosts = 200;
setup.maxMulti = 6;
setup.minEnergyCapacityAvailable = function(){
    return 0.5;
}
setup.maxCount = function(spawn){
    return (spawn.room.sourceAccessibleFields + (spawn.room.sources.length*1.5));
}
setup.maxWeight = function(spawn){
    return (spawn.room.sources.length * 3000);
}

module.exports = setup;

/*

setup.isValidSetup = function(spawn){
    var room = spawn.room;
    
    return (room.energyAvailable > room.energyCapacityAvailable/2 && (
        !room.population.worker || (
        room.population.worker.count < (room.sourceAccessibleFields + (room.sources.length*1.5))  && 
        room.population.worker.weight < (room.sources.length * 3400))));
}
*/