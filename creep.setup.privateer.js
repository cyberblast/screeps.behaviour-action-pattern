var setup = new MODULES.creep.Setup();

setup.type = 'privateer';
setup.multiBody = [CARRY, WORK, MOVE];
setup.fixedBody = [CARRY, WORK, MOVE, CARRY, WORK, MOVE];
setup.minAbsEnergyAvailable = 400;
setup.maxMulti = 4;
setup.minControllerLevel = 4;
setup.multiplicationPartwise = false;
setup.minEnergyAvailable = function(){
    return 0.8;
};
setup.maxCount = function(spawn){
    return _.filter(Game.flags, FLAG_COLOR.invade.exploit.filter).length * 2;
}
setup.maxWeight = function(spawn){
    return null; // no evaluation
}

module.exports = setup;