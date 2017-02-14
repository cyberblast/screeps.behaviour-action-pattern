let setup = new Creep.Setup('healer');
module.exports = setup;
setup.minControllerLevel = 7;
setup.globalMeasurement = true;
setup.RCL = {
    1: setup.none,
    2: setup.none,
    3: setup.none,
    4: setup.none,
    5: setup.none,
    6: setup.none,
    7: {
        fixedBody: [],
        multiBody: [MOVE, HEAL],
        minAbsEnergyAvailable: 300,
        minEnergyAvailable: 0.8,
        maxMulti: 4,
        maxCount: 0,
        maxWeight: 0
    },
    8: {
        fixedBody: [],
        multiBody: [MOVE, HEAL],
        minAbsEnergyAvailable: 300,
        minEnergyAvailable: 0.8,
        maxMulti: 4,
        maxCount: 0,
        maxWeight: 0
    }
};
