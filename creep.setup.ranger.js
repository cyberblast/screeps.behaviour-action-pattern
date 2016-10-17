var setup = new Creep.Setup('ranger');
setup.minControllerLevel = 4;
setup.globalMeasurement = true;
setup.measureByHome = true;
setup.sortedParts = true;
setup.small = {
    fixedBody: [MOVE,MOVE,MOVE,RANGED_ATTACK,RANGED_ATTACK,HEAL], 
    multiBody: [RANGED_ATTACK, MOVE], 
    minAbsEnergyAvailable: 700, 
    minEnergyAvailable: 0.8,
    maxMulti: 6,
    maxCount: () => FlagDir.count(FLAG_COLOR.defense), 
    maxWeight: (room) => room.defenseMaxWeight(1750, 'ranger')
};
setup.mid = {
    fixedBody: [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,HEAL,HEAL,HEAL], 
    multiBody: [RANGED_ATTACK, MOVE], 
    minAbsEnergyAvailable: 1500, 
    minEnergyAvailable: 0.8,
    maxMulti: 10,
    maxCount: () => FlagDir.count(FLAG_COLOR.defense), 
    maxWeight: (room) => room.defenseMaxWeight(2000, 'ranger')
};
setup.big = {
    fixedBody: [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,HEAL,HEAL,HEAL,HEAL,HEAL], 
    multiBody: [RANGED_ATTACK, MOVE], 
    minAbsEnergyAvailable: 2500,  
    minEnergyAvailable: 0.8,
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