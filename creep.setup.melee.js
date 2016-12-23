var setup = new Creep.Setup('melee');
setup.minControllerLevel = 2;
setup.globalMeasurement = true;
setup.measureByHome = true;
setup.maxCount = function(room){
    let maxRange = 2;
    let max = 0;
    let distance, flag;
    let calcMax = flagEntry => {
        distance = routeRange(room.name, flagEntry.roomName);
        if( distance > maxRange )
            return;
        flag = Game.flags[flagEntry.name];
        if( !flag.targetOf || flag.targetOf.length == 0 )
            max++;
    }
    let flagEntries = FlagDir.filter(FLAG_COLOR.defense);
    flagEntries.forEach(calcMax);
    return max;
};
setup.small = {
    fixedBody: [MOVE, HEAL],
    multiBody: [MOVE, ATTACK],
    minAbsEnergyAvailable: 450,
    minEnergyAvailable: 0.8,
    maxMulti: 10,
    maxCount: setup.maxCount,
    maxWeight: null//(room) => room.defenseMaxWeight(500, 'melee')
};
setup.medium = {
    fixedBody: [MOVE, MOVE, HEAL, HEAL],
    multiBody: [MOVE, ATTACK],
    minAbsEnergyAvailable: 900,
    minEnergyAvailable: 0.8,
    maxMulti: 13,
    minMulti: 5,
    maxCount: setup.maxCount,
    maxWeight: null//(room) => room.defenseMaxWeight(1000, 'melee')
};
setup.big = {
    fixedBody: [MOVE, MOVE, MOVE, MOVE, HEAL, HEAL, HEAL, HEAL],
    multiBody: [MOVE, ATTACK],
    minAbsEnergyAvailable: 1800,
    minEnergyAvailable: 0.8,
    maxMulti: 17,
    minMulti: 10,
    maxCount: setup.maxCount,
    maxWeight: null//(room) => room.defenseMaxWeight(1300, 'melee')
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