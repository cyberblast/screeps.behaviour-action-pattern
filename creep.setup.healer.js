var setup = new MODULES.creep.Setup();

setup.type = 'healer';
setup.multiBody = [HEAL, MOVE];
setup.minAbsEnergyAvailable = 300;
setup.maxMulti = 1;
setup.globalMeasurement = true;
setup.minEnergyAvailable = function(){
    return 0.8;
}
setup.maxCount = function(spawn){
    return _.filter(Game.flags, {'color': FLAG_COLOR.defense }).length;
}
setup.maxWeight = function(spawn){
    return null; //1000;
}

module.exports = setup;