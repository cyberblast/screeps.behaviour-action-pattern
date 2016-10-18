var setup = new Creep.Setup('ranger');
setup.minControllerLevel = 4;
setup.globalMeasurement = true;
setup.measureByHome = true;
setup.sortedParts = false;
setup.small = {
    fixedBody: [RANGED_ATTACK,MOVE,RANGED_ATTACK,MOVE,HEAL,MOVE], 
    multiBody: [RANGED_ATTACK, MOVE], 
    minAbsEnergyAvailable: 1200, 
    minEnergyAvailable: 0.5,
    maxMulti: 6,
    maxCount: () => FlagDir.count(FLAG_COLOR.defense), 
    maxWeight: (room) => room.defenseMaxWeight(1750, 'ranger')
};
setup.mid = {
    fixedBody: [RANGED_ATTACK,MOVE,RANGED_ATTACK,MOVE,RANGED_ATTACK,MOVE,HEAL,MOVE,HEAL,MOVE,HEAL,MOVE], 
    multiBody: [RANGED_ATTACK, MOVE], 
    minAbsEnergyAvailable: 2000, 
    minEnergyAvailable: 0.5,
    maxMulti: 10,
    maxCount: () => FlagDir.count(FLAG_COLOR.defense), 
    maxWeight: (room) => room.defenseMaxWeight(2000, 'ranger')
};
setup.big = {
    fixedBody: [RANGED_ATTACK,MOVE,RANGED_ATTACK,MOVE,RANGED_ATTACK,MOVE,RANGED_ATTACK,MOVE,RANGED_ATTACK,MOVE,HEAL,MOVE,HEAL,MOVE,HEAL,MOVE,HEAL,MOVE,HEAL,MOVE], 
    multiBody: [RANGED_ATTACK, MOVE], 
    minAbsEnergyAvailable: 2500,  
    minEnergyAvailable: 0.5,
    maxMulti: 15,
    maxCount: () => FlagDir.count(FLAG_COLOR.defense), 
    maxWeight: (room) => room.defenseMaxWeight(2500, 'ranger')
};
setup.RCL = {
    1: setup.none,
    2: setup.none,
    3: setup.small,
    4: setup.small,
    5: setup.mid,
    6: setup.mid,
    7: setup.big,
    8: setup.big
};
module.exports = setup;