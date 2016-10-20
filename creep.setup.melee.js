var setup = new Creep.Setup('melee');
setup.minControllerLevel = 2;
setup.globalMeasurement = true;
setup.measureByHome = true;
setup.maxCount = function(){
    let max = FlagDir.count(FLAG_COLOR.defense);
    if( Population == null ) return max;
    let ranger = Population.typeCount['ranger'] || 0;
    let warrior = Population.typeCount['warrior'] || 0;
    return max - ranger - warrior;
};
setup.small = {
    fixedBody: [MOVE, HEAL], 
    multiBody: [MOVE, ATTACK], 
    minAbsEnergyAvailable: 450, 
    minEnergyAvailable: 0.8,
    maxMulti: 10,
    maxCount: setup.maxCount, 
    maxWeight: (room) => room.defenseMaxWeight(500, 'melee')
};
setup.medium = {
    fixedBody: [MOVE, MOVE, HEAL, HEAL], 
    multiBody: [MOVE, ATTACK], 
    minAbsEnergyAvailable: 900, 
    minEnergyAvailable: 0.8,
    maxMulti: 13,
    minMulti: 5,
    maxCount: setup.maxCount, 
    maxWeight: (room) => room.defenseMaxWeight(1000, 'melee')
};
setup.big = {
    fixedBody: [MOVE, MOVE, MOVE, MOVE, HEAL, HEAL, HEAL, HEAL], 
    multiBody: [MOVE, ATTACK], 
    minAbsEnergyAvailable: 1800, 
    minEnergyAvailable: 0.8,
    maxMulti: 17,
    minMulti: 10,
    maxCount: setup.maxCount, 
    maxWeight: (room) => room.defenseMaxWeight(1300, 'melee')
};
setup.RCL = {
    1: setup.none,
    2: setup.small,
    3: setup.small,
    4: setup.none,
    5: setup.none,
    6: setup.none,
    7: setup.none,
    8: setup.none
};
module.exports = setup;