var setup = new Creep.Setup('melee');
setup.multiBody = [ATTACK, MOVE]; 
setup.minAbsEnergyAvailable = 260;
setup.maxMulti = function(room){ return 10; };
setup.globalMeasurement = true;
setup.measureByHome = true;
setup.minControllerLevel = 2;
setup.minEnergyAvailable = function(spawn){
    return 0.8;
};
setup.maxCount = function(spawn){
    return FlagDir.count(FLAG_COLOR.defense);
};
setup.maxWeight = function(spawn){
    //return null;
    return spawn.room.defenseMaxWeight(1300, 'melee');
};
module.exports = setup;