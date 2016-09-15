var setup = new Creep.Setup('claimer');
setup.multiBody = [CLAIM, MOVE];
setup.fixedBody = [CLAIM, MOVE, CLAIM, MOVE];
setup.minAbsEnergyAvailable = 1300;
setup.maxMulti = 0;
setup.minControllerLevel = 3;
setup.globalMeasurement = true;
setup.measureByHome = true;
setup.sortedParts = true;
setup.minEnergyAvailable = function(spawn){
    return 0.6;
}

setup.maxCount = function(spawn){
    if (spawn.room.situation.invasion) return 0; // Do not create in the middle of a fight
    if (setup.ShouldWeConserveForDefense(spawn)) return 0;
    return _.filter(Game.flags, flag => (((flag.color == FLAG_COLOR.claim.color && flag.secondaryColor == FLAG_COLOR.claim.secondaryColor) || 
        (flag.color == FLAG_COLOR.claim.reserve.color && flag.secondaryColor == FLAG_COLOR.claim.reserve.secondaryColor)) &&
        (!flag.room || !flag.room.controller || !flag.room.controller.reservation || flag.room.controller.reservation.ticksToEnd < 3500)))
        .length;
}

setup.maxWeight = function(spawn){
    return spawn.room.claimerMaxWeight;
}
module.exports = setup;
