var setup = new Creep.Setup('upgrader');
setup.minControllerLevel = 3;
setup.maxMulti = function(room){ 
    let multi = 0;
    if( !room.storage || room.storage.store.energy > MIN_STORAGE_ENERGY)
        multi++;
    if( !room.storage || room.storage.store.energy > ((MAX_STORAGE_ENERGY-MIN_STORAGE_ENERGY)/2)+MIN_STORAGE_ENERGY)
        multi++;
    if( room.storage && room.storage.store.energy >= MAX_STORAGE_ENERGY )
    {
        let surplus = room.storage.store.energy - MAX_STORAGE_ENERGY;
        multi += Math.ceil( surplus / 20000 ); // one more multi for each 20k surplus (+1)
    }
    return Math.min(11, multi); 
};
setup.maxCount = function(room){
    if (room.situation.invasion || 
        room.conserveForDefense || 
        (room.containerController.length + room.linksController.length) == 0 ) 
        return 0;
    return room.storage ? Math.max(1, Math.floor(room.storage.store.energy / MAX_STORAGE_ENERGY)) : 1;
    // no storage => 1
    // storage < MAX_STORAGE_ENERGY => 1
    // storage < 2 * MAX_STORAGE_ENERGY => 1 (but increased size)
    // storage < 3 * MAX_STORAGE_ENERGY => 2 (and increased size)
    // storage < 4 * MAX_STORAGE_ENERGY => 3 (and increased size) etc..
};
setup.default = {
    fixedBody: [WORK, WORK, CARRY, MOVE], 
    multiBody: [WORK, WORK, WORK, MOVE], 
    minAbsEnergyAvailable: 400, 
    minEnergyAvailable: 0.5,
    maxMulti: setup.maxMulti,
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
