var setup = new Creep.Setup('worker');
setup.RCL = {
    1: {
        fixedBody: [], 
        multiBody: [CARRY, WORK, MOVE], 
        minAbsEnergyAvailable: 200, 
        minEnergyAvailable: 0,
        maxMulti: 8,
        maxCount: room => ( room.situation.invasion ) ? 1 : 4, 
        maxWeight: 1000
    },
    2: {
        fixedBody: [], 
        multiBody: [CARRY, WORK, MOVE], 
        minAbsEnergyAvailable: 200, 
        minEnergyAvailable: 0,
        maxMulti: 8,
        maxCount: room => ( room.situation.invasion ) ? 1 : 6, 
        maxWeight: 2400
    },
    3: {
        fixedBody: [], 
        multiBody: [CARRY, WORK, MOVE], 
        minAbsEnergyAvailable: 200, 
        minEnergyAvailable: 0.3,
        maxMulti: 8,
        maxCount: room => ( room.situation.invasion ) ? 1 : 4, 
        maxWeight: 2400
    },
    4: {
        fixedBody: [], 
        multiBody: [CARRY, WORK, MOVE], 
        minAbsEnergyAvailable: 200, 
        minEnergyAvailable: 0.3,
        maxMulti: 8,
        maxCount: (room) => ( room.situation.invasion || room.storage ) ? 1 : 2, 
        maxWeight: 2400
    },
    5: {
        fixedBody: [], 
        multiBody: [CARRY, WORK, MOVE], 
        minAbsEnergyAvailable: 200, 
        minEnergyAvailable: 0.3,
        maxMulti: 8,
        maxCount: 1, 
        maxWeight: 1200
    },
    6: {
        fixedBody: [], 
        multiBody: [CARRY, WORK, MOVE], 
        minAbsEnergyAvailable: 200, 
        minEnergyAvailable: 0.3,
        maxMulti: 8,
        maxCount: 1, 
        maxWeight: 1200
    },
    7: {
        fixedBody: [], 
        multiBody: [CARRY, WORK, MOVE], 
        minAbsEnergyAvailable: 200, 
        minEnergyAvailable: 0.3,
        maxMulti: 8,
        maxCount: 1, 
        maxWeight: 1200
    },
    8: {
        fixedBody: [], 
        multiBody: [CARRY, WORK, MOVE], 
        minAbsEnergyAvailable: 200, 
        minEnergyAvailable: 0.3,
        maxMulti: 8,
        maxCount: 1, 
        maxWeight: 1200
    },
};
module.exports = setup;
