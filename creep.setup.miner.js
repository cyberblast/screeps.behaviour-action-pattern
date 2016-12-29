var setup = new Creep.Setup('miner');
setup.minControllerLevel = 3;
setup.default = {
    fixedBody: [WORK, WORK, WORK, WORK, CARRY, MOVE],
    multiBody: [WORK, MOVE],
    minAbsEnergyAvailable: 500,
    minEnergyAvailable: 0.3,
    maxMulti: 1,
    maxCount: room => room.sources.length
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
module.exports = setup;