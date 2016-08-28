var setup = new Creep.Setup('pioneer');
setup.multiBody = [WORK, CARRY, MOVE];
setup.fixedBody = [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
setup.minAbsEnergyAvailable = 400;
setup.maxMulti = 4;
setup.minControllerLevel = 3;
setup.globalMeasurement = true;
setup.sortedParts = false;
setup.minEnergyAvailable = function(spawn){
    return 0.75;
};
setup.maxCount = function(spawn){
    return ( FlagDir.count(FLAG_COLOR.claim.spawn) * 4 ) + 
    ( FlagDir.count(FLAG_COLOR.claim.pioneer) * 2 );
    //return _.filter(Game.flags, FLAG_COLOR.claim.spawn.filter).length * 4
    //+ _.filter(Game.flags, FLAG_COLOR.claim.pioneer.filter).length * 2;
};
setup.maxWeight = function(spawn){
    return null; // no evaluation
};
module.exports = setup;