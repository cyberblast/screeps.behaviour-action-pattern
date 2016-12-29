var setup = new Creep.Setup('claimer');
setup.minControllerLevel = 3;
setup.globalMeasurement = true;
setup.measureByHome = true;
setup.maxCount = (room) => ( room.situation.invasion || room.conserveForDefense ) ? 0 : 4;
setup.maxWeight = (room) => room.claimerMaxWeight;

setup.small = {
    fixedBody: [CLAIM, MOVE],
    multiBody: [],
    minAbsEnergyAvailable: 650,
    minEnergyAvailable: 0.6,
    maxMulti: 0,
    maxCount: setup.maxCount,
    maxWeight: setup.maxWeight
};
setup.mid = {
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
    4: setup.mid,
    5: setup.mid,
    6: setup.mid,
    7: setup.large,
    8: setup.large
}
module.exports = setup;
