var setup = new MODULES.creep.Setup();

setup.type = 'pioneer';
setup.multiBody = [CARRY, WORK, MOVE];
setup.fixedBody = [];
setup.minAbsEnergyAvailable = 800;
setup.maxMulti = 6;
setup.multiplicationPartwise = false;
setup.minEnergyAvailable = function(){
    return 0.75;
};
setup.maxCount = function(spawn){
    return _.filter(Game.flags, {'color': FLAG_COLOR.settle }).length*3;
}
setup.maxWeight = function(spawn){
    return null;//1300;
}

module.exports = setup;