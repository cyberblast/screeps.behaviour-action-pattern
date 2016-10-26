var setup = new Creep.Setup('mineralMiner');
setup.minControllerLevel = 6;
setup.maxCount = function(room){
    let max = 0;
    if( room.storage ) {
        let add = mineral => {
            if(mineral.mineralAmount > 0) max++;
                // && (!room.storage.store[mineral.mineralType] || room.storage.store[mineral.mineralType] < MAX_STORAGE_MINERAL ))
        };
        room.minerals.forEach(add);
    }
    return max;
};
setup.default = {
    fixedBody: [WORK, WORK, WORK, WORK, CARRY, MOVE], 
    multiBody: [WORK, MOVE], 
    minAbsEnergyAvailable: 500, 
    minEnergyAvailable: 0.3,
    maxMulti: 22,
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
