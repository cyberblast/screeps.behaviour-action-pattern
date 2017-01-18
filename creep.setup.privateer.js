let setup = new Creep.Setup('privateer');
module.exports = setup;
setup.minControllerLevel = 3;
setup.globalMeasurement = true;
setup.measureByHome = true;
setup.default = {
    fixedBody: [WORK, CARRY, MOVE],
    multiBody: [WORK, CARRY, MOVE],
    minAbsEnergyAvailable: 400,
    minEnergyAvailable: 0.8,
    maxMulti: 15,
    minMulti: (room) => (room.controller.level),
    maxWeight: (room) => room.privateerMaxWeight
};
setup.RCL = {
    1: setup.none,
    2: setup.none,
    3: setup.default,
    4: setup.default,
    5: setup.default,
    6: setup.default,
    7: setup.default,
    8: setup.default
};
