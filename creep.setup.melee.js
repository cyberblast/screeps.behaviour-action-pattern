var setup = new MODULES.creep.Setup();

setup.type = 'melee';
setup.multiBody = [TOUGH, TOUGH, ATTACK, MOVE, MOVE, MOVE]; 
setup.minAbsEnergyAvailable = 250;
setup.maxMulti = 4;
setup.globalMeasurement = true;
setup.minControllerLevel = 2;
setup.minEnergyAvailable = function(){
    return 0.8;
}
setup.maxCount = function(spawn){
    return _.filter(Game.flags, FLAG_COLOR.defense.filter).length*2;
}
setup.maxWeight = function(spawn){
    return null; // no evaluation
}

module.exports = setup;