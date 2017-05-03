let setup = new Creep.Setup('worker');
module.exports = setup;
setup.maxWorker = room => {
    let count = room.controller.level < 8 ? 1 : 0; // no need to always have a worker at RCL8
    // no hauler and no miner => 1
    // if there is a miner it should be no problem to spawn a hauler, and vice versa. 
    // if none of them are present spawn a worker first
    if (room.controller.level < 4) {
        if (room.situation.invasion) return 1;
        let max = room.controller.level === 2 ? 6 : 4;
        const numPioneers = room.population && room.population.typeCount.pioneer || 0;
        return max - numPioneers;
    }
    if( !setup.hasMinerOrHauler(room))
        count = count + 1;
    // constructionsites present & no strorage or storage > min
    if( room.myConstructionSites.length > 0 && ((!room.storage || !room.storage.active)
        || room.storage.store && room.storage.charge > 0))
        count = count + 1;
    // storage full & base fortifyable
    if( room.storage && room.storage.active && room.storage.charge > 1 && room.structures.fortifyable.length > 0 )
        count = count + 1;
    return count;
};
// validates if there is a miner or a hauler present
setup.hasMinerOrHauler = room => ( room.population &&
    ((room.population.typeCount.hauler && room.population.typeCount.hauler > 0) ||
    (room.population.typeCount.miner && room.population.typeCount.miner > 0 )));
// this assures that the first worker gets spawned immediately, but later workers require more energy, giving preference to miners
setup.byPopulation = function(type, start, perBody, limit) {
    return function(room) {
        const result = start + (room.population && (room.population.typeCount[type] * perBody) || 0);
        if( !limit || result <= limit ) {
            return result;
        } else {
            return limit;
        }
    };
};
setup.RCL = {
    1: {
        fixedBody: [],
        multiBody: [CARRY, WORK, MOVE,MOVE],
        minAbsEnergyAvailable: 250,
        minEnergyAvailable: setup.byPopulation(setup.type, 0, 1, 1),
        maxMulti: 8,
        maxCount: room => setup.maxWorker(room),
        maxWeight: 4000
    },
    2: {
        fixedBody: [],
        multiBody: [CARRY, WORK, MOVE,MOVE],
        minAbsEnergyAvailable: 250,
        minEnergyAvailable: setup.byPopulation(setup.type, 0, 0.5, 1),
        maxMulti: 8,
        maxCount: room => setup.maxWorker(room),
        maxWeight: 14400
    },
    3: {
        fixedBody: [],
        multiBody: [CARRY, WORK, MOVE],
        minAbsEnergyAvailable: 200,
        minEnergyAvailable: room => setup.hasMinerOrHauler(room) ? 0.3 : 0,
        maxMulti: 8,
        maxCount: room => setup.maxWorker(room),
        maxWeight: 9600
    },
    4: {
        fixedBody: [],
        multiBody: [CARRY, WORK, MOVE],
        minAbsEnergyAvailable: 200,
        minEnergyAvailable: room => setup.hasMinerOrHauler(room) ? 0.3 : 0,
        maxMulti: 8,
        maxCount: (room) => ( room.situation.invasion || room.storage ) ? setup.maxWorker(room) : 2,
        maxWeight: 4800
    },
    5: {
        fixedBody: [],
        multiBody: [CARRY, WORK, MOVE],
        minAbsEnergyAvailable: 400,
        minEnergyAvailable: room => setup.hasMinerOrHauler(room) ? 0.3 : 0,
        maxMulti: 8,
        maxCount: room => setup.maxWorker(room),
        maxWeight: 2000
    },
    6: {
        fixedBody: [],
        multiBody: [CARRY, WORK, MOVE],
        minAbsEnergyAvailable: 600,
        minEnergyAvailable: room => setup.hasMinerOrHauler(room) ? 0.3 : 0,
        maxMulti: 8,
        maxCount: room => setup.maxWorker(room),
        maxWeight: 2000
    },
    7: {
        fixedBody: [],
        multiBody: [CARRY, WORK, MOVE],
        minAbsEnergyAvailable: 800,
        minEnergyAvailable: room => setup.hasMinerOrHauler(room) ? 0.2 : 0,
        maxMulti: 10,
        maxCount: room => setup.maxWorker(room),
        maxWeight: 2000
    },
    8: {
        fixedBody: [],
        multiBody: [CARRY, WORK, MOVE],
        minAbsEnergyAvailable: 800,
        minEnergyAvailable: room => setup.hasMinerOrHauler(room) ? 0.1 : 0,
        maxMulti: room => (( (!room.storage || !room.storage.active) || room.storage.energy > MAX_STORAGE_ENERGY[8] ) ? 16 : 10),
        maxCount: room => setup.maxWorker(room),
        maxWeight: 3200
    }
};
