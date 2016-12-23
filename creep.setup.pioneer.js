var setup = new Creep.Setup('pioneer');
setup.minControllerLevel = 3;
setup.globalMeasurement = true;
setup.maxCount = function(room){
    if ( room.situation.invasion || room.conserveForDefense )
        return 0;
    return ( FlagDir.count(FLAG_COLOR.claim.spawn) * 4 ) + FlagDir.count(FLAG_COLOR.claim.pioneer);
};
setup.default = {
    fixedBody: [WORK, WORK, CARRY, CARRY, MOVE, MOVE],
    multiBody: [WORK, CARRY, MOVE],
    minAbsEnergyAvailable: 400,
    minEnergyAvailable: 0.75,
    maxMulti: 4,
    maxCount: setup.maxCount
};
setup.RCL = {
    1: setup.none,
    2: setup.none,
    3: setup.default,
    4: setup.default,
    5: setup.default,
    6: setup.default,
    7: setup.default,
    8: setup.default
};
module.exports = setup;