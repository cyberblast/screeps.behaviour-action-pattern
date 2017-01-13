var setup = new Creep.Setup('remoteWorker');
setup.minControllerLevel = 4;
setup.default = {
        fixedBody: [MOVE, MOVE, MOVE, CARRY, CARRY, WORK, WORK, WORK, WORK],
        multiBody: [],
        minAbsEnergyAvailable: 650,
        minEnergyAvailable: 0.3,
        maxMulti: 0,
        maxCount: REMOTE_WORKER_MULTIPLIER
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
