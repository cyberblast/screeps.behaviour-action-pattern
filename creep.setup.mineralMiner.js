var setup = new Creep.Setup('mineralMiner');
setup.minControllerLevel = 6;
setup.maxCount = function(room){
    let max = 0;
    if( room.storage && room.storage.sum < room.storage.storeCapacity * 0.9 ) {
        let add = mineral => {
            if(mineral.mineralAmount > 0) max++;
        };
        room.minerals.forEach(add);
    }
    return max;
};
setup.default = {
    fixedBody: [WORK, WORK, WORK, CARRY, MOVE],
    multiBody: [WORK, WORK, WORK, MOVE],
    minAbsEnergyAvailable: 750,
    minEnergyAvailable: 0.3,
    maxMulti: 11,
    minMulti: 1,
    maxCount: setup.maxCount
};
setup.RCL = {
    1: setup.none,
    2: setup.none,
    3: setup.none,
    4: setup.none,
    5: setup.none,
    6: setup.default,
    7: setup.default,
    8: setup.default
};
module.exports = setup;
