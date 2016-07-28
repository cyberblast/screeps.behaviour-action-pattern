var setup = new MODULES.creep.Setup();

setup.type = 'pioneer';
setup.multiBody = [CARRY, WORK, MOVE];
setup.fixedBody = [CARRY, WORK, MOVE, CARRY, WORK, MOVE];
setup.minAbsEnergyAvailable = 400;
setup.maxMulti = 4;
setup.minControllerLevel = 4;
setup.multiplicationPartwise = false;
setup.minEnergyAvailable = function(){
    return 0.75;
};
setup.maxCount = function(spawn){
    return _.filter(Game.flags, {'color': FLAG_COLOR.settle }).length*3;
}
setup.maxWeight = function(spawn){
    return null; // no evaluation
}

module.exports = setup;