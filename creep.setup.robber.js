var setup = new Creep.Setup('robber');
setup.minControllerLevel = 3;
setup.maxCount = function(room){
   
   //get flag stuff
   
};
setup.default = {
    fixedBody: [WORK, CARRY, MOVE], 
    multiBody: [CARRY, CARRY, MOVE], 
    minAbsEnergyAvailable: 250, 
    minEnergyAvailable: 0.3,
    maxMulti: 11, 
    minMulti: 1,
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
