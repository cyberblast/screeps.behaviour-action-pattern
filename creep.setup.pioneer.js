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
    return 0; // TODO: Setup TEAMS
};
setup.maxWeight = function(spawn){
    return 0;
};

module.exports = setup;