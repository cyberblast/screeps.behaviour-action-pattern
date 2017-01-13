var setup = new Creep.Setup('remoteMiner');
setup.minControllerLevel = 4;
setup.default = {
        fixedBody: [MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK],
        multiBody: [],
        minAbsEnergyAvailable: 650,
        minEnergyAvailable: 0.3,
        maxMulti: 0,
        maxCount: room => room.sources.length
};
setup.RCL = {
    1: setup.none,
    2: setup.none,
    3: setup.none,
    4: setup.default,
    5: setup.default,
    6: setup.default,
    7: setup.default,
    8: setup.default
};
module.exports = setup;
