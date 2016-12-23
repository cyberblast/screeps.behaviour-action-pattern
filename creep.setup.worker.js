var setup = new Creep.Setup('worker');
setup.RCL = {
    1: {
        fixedBody: [],
        multiBody: [CARRY, WORK, MOVE],
        minAbsEnergyAvailable: 200,
        minEnergyAvailable: 0,
        maxMulti: 8,
        maxCount: room => ( room.situation.invasion ) ? 1 : 4,
        maxWeight: 4000
    },
    2: {
        fixedBody: [],
        multiBody: [CARRY, WORK, MOVE],
        minAbsEnergyAvailable: 200,
        minEnergyAvailable: 0,
        maxMulti: 8,
        maxCount: room => ( room.situation.invasion ) ? 1 : 6,
        maxWeight: 14400
    },
    3: {
        fixedBody: [],
        multiBody: [CARRY, WORK, MOVE],
        minAbsEnergyAvailable: 200,
        minEnergyAvailable: 0.3,
        maxMulti: 8,
        maxCount: room => ( room.situation.invasion ) ? 1 : 4,
        maxWeight: 9600
    },
    4: {
        fixedBody: [],
        multiBody: [CARRY, WORK, MOVE],
        minAbsEnergyAvailable: 200,
        minEnergyAvailable: 0.3,
        maxMulti: 8,
        maxCount: (room) => ( room.situation.invasion || room.storage ) ? 1 : 2,
        maxWeight: 4800
    },
    5: {
        fixedBody: [],
        multiBody: [CARRY, WORK, MOVE],
        minAbsEnergyAvailable: 400,
        minEnergyAvailable: 0.3,
        maxMulti: 8,
        maxCount: 1,
        maxWeight: 2000
    },
    6: {
        fixedBody: [],
        multiBody: [CARRY, WORK, MOVE],
        minAbsEnergyAvailable: 600,
        minEnergyAvailable: 0.3,
        maxMulti: 8,
        maxCount: 1,
        maxWeight: 2000
    },
    7: {
        fixedBody: [],
        multiBody: [CARRY, WORK, MOVE],
        minAbsEnergyAvailable: 800,
        minEnergyAvailable: 0.2,
        maxMulti: 10,
        maxCount: 1,
        maxWeight: 2000
    },
    8: {
        fixedBody: [],
        multiBody: [CARRY, WORK, MOVE],
        minAbsEnergyAvailable: 800,
        minEnergyAvailable: 0.1,
        maxMulti: room => (( !room.storage || room.storage.energy > MAX_STORAGE_ENERGY[8] ) ? 16 : 10),
        maxCount: 1,
        maxWeight: 3200
    }
};
module.exports = setup;
