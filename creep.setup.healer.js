var setup = new Creep.Setup('healer');
setup.minControllerLevel = 7;
setup.globalMeasurement = true;
setup.RCL = {
    7: {
        fixedBody: [], 
        multiBody: [MOVE, HEAL], 
        minAbsEnergyAvailable: 300, 
        minEnergyAvailable: 0.8,
        maxMulti: 4,
        maxCount: 0, 
        maxWeight: 0
    },
    8: {
        fixedBody: [], 
        multiBody: [MOVE, HEAL], 
        minAbsEnergyAvailable: 300, 
        minEnergyAvailable: 0.8,
        maxMulti: 4,
        maxCount: 0, 
        maxWeight: 0
    }
};
module.exports = setup;