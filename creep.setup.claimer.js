var setup = new Creep.Setup('claimer');
setup.minControllerLevel = 3;
setup.globalMeasurement = true;
setup.measureByHome = true;
setup.sortedParts = true;

setup.maxCount = (room) => ( room.situation.invasion || room.conserveForDefense ) ? 0 : 2; 
setup.maxWeight = (room) => room.claimerMaxWeight;

setup.small = {
    fixedBody: [CLAIM, MOVE, CLAIM, MOVE], 
    multiBody: [], 
    minAbsEnergyAvailable: 1300, 
    minEnergyAvailable: 0.6,
    maxMulti: 0,
    maxCount: setup.maxCount, 
    maxWeight: setup.maxWeight
};
setup.large = {
    fixedBody: [CLAIM, MOVE, CLAIM, MOVE], 
    multiBody: [CLAIM, MOVE], 
    minAbsEnergyAvailable: 1300, 
    minEnergyAvailable: 0.6,
    maxMulti: 1,
    maxCount: setup.maxCount, 
    maxWeight: setup.maxWeight
};

setup.RCL = {
    1: setup.none,
    2: setup.none,
    3: setup.small,
    4: setup.small,
    5: setup.small,
    6: setup.small,
    7: setup.large,
    8: setup.large
}
module.exports = setup;