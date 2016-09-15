var setup = new Creep.Setup('melee');
setup.multiBody = [ATTACK, MOVE]; 
setup.minAbsEnergyAvailable = 260;
setup.maxMulti = 10;
setup.globalMeasurement = true;
setup.minControllerLevel = 2;
setup.minEnergyAvailable = function(spawn){
    return 0.8;
};
setup.maxCount = function(spawn){
    let currentDefense = FlagDir.count(FLAG_COLOR.defense);
    if (SPAWN_DEFENSE_ON_ATTACK && spawn.room.situation.invasion) {
        currentDefense += 1;
        if (DEBUG) console.log('You are being invaded.  We are spawning a melee creep automatically. ');
    }
    return currentDefense;
};
setup.maxWeight = function(spawn){
    return null;
};
module.exports = setup;