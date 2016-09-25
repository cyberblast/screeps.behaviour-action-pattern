var setup = new Creep.Setup('worker');
setup.multiBody = [CARRY, WORK, MOVE];
setup.minAbsEnergyAvailable = 200;
setup.maxMulti = function(room){ return 8; };
setup.sortedParts = false;
setup.minEnergyAvailable = function(spawn){
    return 0.3;
};
setup.maxCount = function(spawn){
    if ( spawn.room.situation.invasion || spawn.room.conserveForDefense ) 
        return 1;
    let limits = {
        1: 4,
        2: 6,
        3: 3,
        4: 2,
        5: 1,
        6: 1,
        7: 1, 
        8: 1
    }
    return limits[spawn.room.controller.level];
};
setup.maxWeight = function(spawn){
    let limits = {
        1: 1000,
        2: 2400,
        3: 2400,
        4: 2400,
        5: 1200,
        6: 1200,
        7: 1200, 
        8: 1200
    }
    return limits[spawn.room.controller.level];
};
module.exports = setup;
