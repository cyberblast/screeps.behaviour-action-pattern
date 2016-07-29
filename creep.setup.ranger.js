var setup = new MODULES.creep.Setup();

setup.type = 'ranger';
setup.multiBody = [RANGED_ATTACK, MOVE]; 
setup.minAbsEnergyAvailable = 200;
setup.maxMulti = 2;
setup.globalMeasurement = true;
setup.minControllerLevel = 3;
setup.multiplicationPartwise = false;
setup.minEnergyAvailable = function(){
    return 0.8;
}
setup.maxCount = function(spawn){
    return _.filter(Game.flags, FLAG_COLOR.defense.filter).length;
}
setup.maxWeight = function(spawn){
    return null; // no evaluation 
}

module.exports = setup;