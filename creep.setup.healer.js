var setup = new Creep.Setup('healer');
setup.multiBody = [MOVE, HEAL];
setup.minAbsEnergyAvailable = 300;
setup.maxMulti = 1;
setup.globalMeasurement = true;
setup.minControllerLevel = 7;
setup.multiplicationPartwise = false;
setup.minEnergyAvailable = function(){
    return 0.8;
}
setup.maxCount = function(spawn){
    return _.filter(Game.flags, FLAG_COLOR.defense.filter).length;
}
setup.maxWeight = function(spawn){
    return null;
}
module.exports = setup;