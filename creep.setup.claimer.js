var setup = _.cloneDeep(require('creep.setup'));

setup.type = 'claimer';
setup.body = [CLAIM, MOVE];
setup.defaultBodyCosts = 650;
setup.maxMulti = 1;
setup.minEnergyAvailable = function(){
    return 0.9;
}
setup.maxCount = function(spawn){
    return ( (Game.flags['Claim'] && _.some(Memory.creeps, {'setup': 'claimer'})) ? 0 : 1);
}
setup.maxWeight = function(spawn){
    return 1300;
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