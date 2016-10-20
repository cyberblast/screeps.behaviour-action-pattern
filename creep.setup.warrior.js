var setup = new Creep.Setup('warrior');
setup.minControllerLevel = 4;
setup.globalMeasurement = true;
setup.measureByHome = true;
setup.sortedParts = true;
setup.maxCount = function(){
    let max = FlagDir.count(FLAG_COLOR.defense);
    if( Population == null ) return max;
    let warrior = Population.typeCount['warrior'] || 0;
    let melee = Population.typeCount['melee'] || 0;
    return max - melee - warrior;
};
setup.small = {
    fixedBody: [ATTACK,RANGED_ATTACK,HEAL,MOVE,MOVE,MOVE], 
    multiBody: [ATTACK, RANGED_ATTACK, MOVE, MOVE], 
    minAbsEnergyAvailable: 1000, 
    minEnergyAvailable: 0.5,
    maxMulti: 3,
    maxCount: setup.maxCount, 
    maxWeight: (room) => room.defenseMaxWeight(1750, 'warrior')
};
setup.mid = {
    fixedBody: [HEAL,HEAL,HEAL,MOVE,MOVE,MOVE], 
    multiBody: [ATTACK, RANGED_ATTACK, MOVE, MOVE], 
    minAbsEnergyAvailable: 1800, 
    minEnergyAvailable: 0.5,
    maxMulti: 7,
    minMulti: 3,
    maxCount: setup.maxCount,
    maxWeight: (room) => room.defenseMaxWeight(2000, 'warrior')
};
setup.big = {
    fixedBody: [HEAL,HEAL,HEAL,HEAL,HEAL,MOVE,MOVE,MOVE,MOVE,MOVE], 
    multiBody: [ATTACK, RANGED_ATTACK, MOVE, MOVE], 
    minAbsEnergyAvailable: 2500,  
    minEnergyAvailable: 0.5,
    maxMulti: 10,
    minMulti: 5,
    maxCount: setup.maxCount,
    maxWeight: (room) => room.defenseMaxWeight(2500, 'warrior')
};
setup.RCL = {
    1: setup.none,
    2: setup.none,
    3: setup.none,
    4: setup.none,
    5: setup.none,
    6: setup.mid,
    7: setup.mid,
    8: setup.big
};
module.exports = setup;