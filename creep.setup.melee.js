var setup = new MODULES.creep.Setup();

setup.type = 'melee';
setup.body = [TOUGH, TOUGH, ATTACK, MOVE, MOVE, MOVE]; 
setup.defaultBodyCosts = 250;
setup.maxMulti = 4;
setup.globalMeasurement = true;
setup.minEnergyAvailable = function(){
    return 0.8;
}
setup.maxCount = function(spawn){
    return _.filter(Game.flags, {'color': FLAG_COLOR.defense }).length;
}
setup.maxWeight = function(spawn){
    return 1000;
}

module.exports = setup;