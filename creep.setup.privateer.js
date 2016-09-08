var setup = new Creep.Setup('privateer');
setup.multiBody = [WORK, CARRY, MOVE];
setup.fixedBody = [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
setup.minAbsEnergyAvailable = 400;
setup.maxMulti = 4;
setup.minControllerLevel = 3;
setup.globalMeasurement = true;
setup.sortedParts = false;
setup.minEnergyAvailable = function(spawn){
    return 0.8;
};
setup.maxWeight = function(spawn){
    let flagEntries = FlagDir.filter(FLAG_COLOR.invade.exploit);
    let max = 0;
    let base = 2800;
    let flagWeight = flagEntry => {
        var flag = Game.flags[flagEntry.name];
        let room;
        if( flag && (room = flag.room) ) {
            max += base * room.sources.length * (
                (room.controller && (room.controller.my || 
                (room.controller.reservation && room.controller.reservation.username == spawn.owner.username))) 
                ? 2 : 1);
        }
    };
    _.forEach(flagEntries, flagWeight);
    return max;
    //return FlagDir.count(FLAG_COLOR.invade.exploit) * 3000;
}
module.exports = setup;