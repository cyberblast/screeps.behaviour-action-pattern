var setup = new Creep.Setup('claimer');

setup.multiBody = [CLAIM, MOVE];
setup.fixedBody = [CLAIM, MOVE, CLAIM, MOVE];
setup.minAbsEnergyAvailable = 1300;
setup.maxMulti = 1;
setup.minControllerLevel = 3;
setup.globalMeasurement = true;
setup.multiplicationPartwise = false;

setup.minEnergyAvailable = function(){
    return 0.75;
}
setup.maxCount = function(spawn){
    return _.filter(Game.flags, function(flag){
        return flag.color == FLAG_COLOR.claim.color && flag.secondaryColor == FLAG_COLOR.claim.secondaryColor && 
            (!flag.room || 
            (!flag.room.controller || !flag.room.controller.reservation) || 
            flag.room.controller.reservation.ticksToEnd < 4000)}).length;
}
setup.maxWeight = function(spawn){
    return null; // TODO: limit regarding to missing reservation points
}
module.exports = setup;
