let setup = new Creep.Setup('recycler');
module.exports = setup;
setup.minControllerLevel = 1;
setup.default = {
    fixedBody: [CARRY, MOVE],
    multiBody: [CARRY, MOVE],
    minAbsEnergyAvailable: 100,
};
setup.RCL = {
    1: setup.default,
    2: setup.default,
    3: setup.default,
    4: setup.default,
    5: setup.default,
    6: setup.default,
    7: setup.default,
    8: setup.default
};
