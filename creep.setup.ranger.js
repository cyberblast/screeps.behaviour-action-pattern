var setup = new Creep.Setup('ranger');
setup.minControllerLevel = 5;
setup.globalMeasurement = true;
setup.measureByHome = true;
setup.default = {
    fixedBody: [], 
    multiBody: [RANGED_ATTACK, MOVE], 
    minAbsEnergyAvailable: 200, 
    minEnergyAvailable: 0.8,
    maxMulti: 10,
    maxCount: () => FlagDir.count(FLAG_COLOR.defense), 
    maxWeight: (room) => room.defenseMaxWeight(2000, 'ranger')
};
setup.RCL = {
    5: setup.default,
    6: setup.default,
    7: setup.default,
    8: setup.default
};
module.exports = setup;