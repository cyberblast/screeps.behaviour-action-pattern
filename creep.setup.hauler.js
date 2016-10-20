var setup = new Creep.Setup('hauler');
setup.minControllerLevel = 3;

setup.maxMulti = function(room) {
    let max = 7; 
    if( room.minerals.length > 0 ) 
        max += 2; 
    let contSum = _.sum(room.containerIn.map(e => _.sum(e.store)));
    max += Math.floor(contSum / 1000);
    max += Creep.setup.upgrader.maxMulti(room);
    return Math.min(max, 16);
};
setup.maxCount = function(room){
    let count = 0;
    if(room.population && room.population.typeCount['miner'] > 0) {
        count += Creep.setup.upgrader.maxCount(room);
        if( room.links.length < 3) count++;
    }
    return count; 
};
setup.maxWeight = function(room){
    return setup.maxCount(room) * 2000; 
};
setup.default = {
    fixedBody: [], 
    multiBody: [CARRY, CARRY, MOVE], 
    minAbsEnergyAvailable: 150, 
    minEnergyAvailable: 0.4,
    maxMulti: setup.maxMulti,
    maxCount: setup.maxCount, 
    maxWeight: setup.maxWeight
};
setup.RCL = {
    1: setup.none,
    2: setup.default,
    3: setup.default,
    4: setup.default,
    5: setup.default,
    6: setup.default,
    7: setup.default,
    8: setup.default
};
module.exports = setup;