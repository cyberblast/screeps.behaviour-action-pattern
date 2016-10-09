var setup = new Creep.Setup('melee');
setup.minControllerLevel = 2;
setup.globalMeasurement = true;
setup.measureByHome = true;
setup.default = {
    fixedBody: [], 
    multiBody: [ATTACK, MOVE], 
    minAbsEnergyAvailable: 260, 
    minEnergyAvailable: 0.8,
    maxMulti: 10,
    maxCount: () => FlagDir.count(FLAG_COLOR.defense), 
    maxWeight: (room) => room.defenseMaxWeight(1300, 'melee')
};
setup.RCL = {
    1: setup.none,
    2: setup.default,
    3: setup.default,
    4: setup.default,
    5: setup.default,
    6: setup.default,
    7: setup.default,
    8: setup.default
};
module.exports = setup;