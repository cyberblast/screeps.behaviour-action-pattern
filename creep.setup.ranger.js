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

    if (setup.EnoughStorageIsAvailableForDefense(spawn) && !spawn.room.situation.invasion)
        return 0;
    else
        return FlagDir.count(FLAG_COLOR.defense);

}
setup.maxWeight = function(spawn){
    return null; 
}
module.exports = setup;