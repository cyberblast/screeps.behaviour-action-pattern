var setup = new Creep.Setup('ranger');
setup.multiBody = [RANGED_ATTACK, MOVE]; 
setup.minAbsEnergyAvailable = 200;
setup.maxMulti = 10;
setup.globalMeasurement = true;
setup.minControllerLevel = 5;
setup.minEnergyAvailable = function(spawn){
    return 0.8;
}
setup.maxCount = function(spawn){

    let currentDefense = FlagDir.count(FLAG_COLOR.defense);

    if (SPAWN_DEFENSE_ON_ATTACK && spawn.room.situation.invasion) {
        currentDefense += 1;
    }

    return currentDefense;


}
setup.maxWeight = function(spawn){
    return null; 
}
module.exports = setup;