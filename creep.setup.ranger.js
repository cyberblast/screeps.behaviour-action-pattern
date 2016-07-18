var setup = new MODULES.creep.Setup();

setup.type = 'ranger';
setup.multiBody = [RANGED_ATTACK, MOVE]; 
setup.minAbsEnergyAvailable = 200;
setup.maxMulti = 4;
setup.globalMeasurement = true;
setup.minEnergyAvailable = function(){
    return 0.8;
}
setup.maxCount = function(spawn){
    return _.filter(Game.flags, {'color': FLAG_COLOR.defense }).length;
}
setup.maxWeight = function(spawn){
    return null;// 1200;
}

module.exports = setup;