let setup = new Creep.Setup('mineralMiner');
module.exports = setup;
setup.minControllerLevel = 6;
setup.maxCount = function(room) {
    let max = 0;
    let haulers = (room.population.typeCount.hauler || 0);
    if( haulers === 0 ) return 0;
    if( room.storage && room.storage.sum < room.storage.storeCapacity * 0.9 ) {
        let add = mineral => {
            if(mineral.mineralAmount > 0) max++;
        };
        room.minerals.forEach(add);
    }
    return max;
};
setup.default = {
    fixedBody: {
        [CARRY]: 1,
        [MOVE]: 1,
        [WORK]: 3,
    },
    multiBody: {
        [MOVE]: 1,
        [WORK]: 3,
    },
    minAbsEnergyAvailable: 750,
    minEnergyAvailable: 0.3,
    maxMulti: 11,
    minMulti: 1,
    maxCount: room => setup.maxCount(room),
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
