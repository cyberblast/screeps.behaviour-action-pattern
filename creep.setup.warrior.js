var setup = new Creep.Setup('warrior');
setup.minControllerLevel = 4;
setup.globalMeasurement = true;
setup.measureByHome = true;
setup.maxCount = function(room){
    /*
    let max = FlagDir.count(FLAG_COLOR.defense);
    if( Population == null ) return max;
    let warrior = Population.typeCount['warrior'] || 0;
    let melee = Population.typeCount['melee'] || 0;
    return max - melee - warrior;
    */
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
    fixedBody: [ATTACK,RANGED_ATTACK,HEAL,MOVE,MOVE,MOVE], 
    multiBody: [ATTACK, RANGED_ATTACK, MOVE, MOVE], 
    minAbsEnergyAvailable: 1000, 
    minEnergyAvailable: 0.5,
    maxMulti: 3,
    maxCount: setup.maxCount, 
    maxWeight: null//(room) => room.defenseMaxWeight(1750, 'warrior')
};
setup.mid = {
    fixedBody: [], 
    multiBody: [TOUGH, ATTACK, RANGED_ATTACK, HEAL, MOVE, MOVE], 
    minAbsEnergyAvailable: 1500, 
    minEnergyAvailable: 0.5,
    maxMulti: 5, // 7
    minMulti: 3,
    maxCount: setup.maxCount,
    maxWeight: null//(room) => room.defenseMaxWeight(2000, 'warrior')
};
setup.big = {
    fixedBody: [], 
    multiBody: [TOUGH, ATTACK, RANGED_ATTACK, HEAL, MOVE, MOVE], 
    minAbsEnergyAvailable: 2000,  
    minEnergyAvailable: 0.5,
    maxMulti:  7,
    minMulti: 5,
    maxCount: setup.maxCount,
    maxWeight: null//(room) => room.defenseMaxWeight(2500, 'warrior')
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