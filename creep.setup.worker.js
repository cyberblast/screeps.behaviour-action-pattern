var setup = new Creep.Setup('worker');
setup.maxWorker = room => {
    // no hauler and no miner => 1
    // if there is a miner it should be no problem to spawn a hauler, and vice versa. 
    // if none of them are present spawn a worker first
    if( !this.hasMinerOrHauler(creep.room))
        return 1;
    // constructionsites present & no strorage or storage > min
    if( room.constructionSites.length > 0 && !room.storage || room.storage.store.energy > MIN_STORAGE_ENERGY[room.controller.level]) 
        return 1;
    // storage full & base fortifyable
    if( room.storage && room.storage.store.energy > MAX_STORAGE_ENERGY[room.controller.level] && room.structures.fortifyable.length > 0 ) 
        return 1;
    return 0;
};
// validates if there is a miner or a hauler present
setup.hasMinerOrHauler = room => ( creep.room.population &&
    ((creep.room.population.typeCount['hauler'] && creep.room.population.typeCount['hauler'] > 0) ||
    (creep.room.population.typeCount['miner'] && creep.room.population.typeCount['miner'] > 0 )));
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
        minEnergyAvailable: room => this.hasMinerOrHauler(room) ? 0.3 : 0,
        maxMulti: 8,
        maxCount: room => ( room.situation.invasion ) ? 1 : 4,
        maxWeight: 9600
    },
    4: {
        fixedBody: [],
        multiBody: [CARRY, WORK, MOVE],
        minAbsEnergyAvailable: 200,
        minEnergyAvailable: room => this.hasMinerOrHauler(room) ? 0.3 : 0,
        maxMulti: 8,
        maxCount: (room) => ( room.situation.invasion || room.storage ) ? this.maxWorker(room) : 2,
        maxWeight: 4800
    },
    5: {
        fixedBody: [],
        multiBody: [CARRY, WORK, MOVE],
        minAbsEnergyAvailable: 400,
        minEnergyAvailable: room => this.hasMinerOrHauler(room) ? 0.3 : 0,
        maxMulti: 8,
        maxCount: this.maxWorker(room),
        maxWeight: 2000
    },
    6: {
        fixedBody: [],
        multiBody: [CARRY, WORK, MOVE],
        minAbsEnergyAvailable: 600,
        minEnergyAvailable: room => this.hasMinerOrHauler(room) ? 0.3 : 0,
        maxMulti: 8,
        maxCount: this.maxWorker(room),
        maxWeight: 2000
    },
    7: {
        fixedBody: [],
        multiBody: [CARRY, WORK, MOVE],
        minAbsEnergyAvailable: 800,
        minEnergyAvailable: room => this.hasMinerOrHauler(room) ? 0.2 : 0,
        maxMulti: 10,
        maxCount: this.maxWorker(room),
        maxWeight: 2000
    },
    8: {
        fixedBody: [],
        multiBody: [CARRY, WORK, MOVE],
        minAbsEnergyAvailable: 800,
        minEnergyAvailable: room => this.hasMinerOrHauler(room) ? 0.1 : 0,
        maxMulti: room => (( !room.storage || room.storage.energy > MAX_STORAGE_ENERGY[8] ) ? 16 : 10),
        maxCount: this.maxWorker(room),
        maxWeight: 3200
    }
};
module.exports = setup;
