var setup = new Creep.Setup('upgrader');
setup.multiBody = [WORK, WORK, WORK, MOVE];
setup.fixedBody = [WORK, WORK, CARRY, MOVE];
setup.minAbsEnergyAvailable = 400;
setup.maxMulti = function(room){ 
    let multi = 3;
    if( room.storage && room.storage.store.energy >= MAX_STORAGE_ENERGY )
    {
        let surplus = room.storage.store.energy - MAX_STORAGE_ENERGY;
        multi += Math.ceil( surplus / 20000 ); // one more multi for each 20k surplus (+1)
    }
    return multi; 
};
setup.minEnergyAvailable = function(spawn){
    return 0.5;
};
setup.maxCount = function(spawn){
    if (spawn.room.situation.invasion || spawn.room.conserveForDefense || spawn.room.containerController.length == 0 ) 
        return 0;
    return spawn.room.storage ? Math.max(1, Math.floor(spawn.room.storage.store.energy / MAX_STORAGE_ENERGY)) : 1;
    // no storage => 1
    // storage < MAX_STORAGE_ENERGY => 1
    // storage < 2 * MAX_STORAGE_ENERGY => 1 (but increased size)
    // storage < 3 * MAX_STORAGE_ENERGY => 2 (and increased size)
    // storage < 4 * MAX_STORAGE_ENERGY => 3 (and increased size) etc..
};
setup.maxWeight = function(spawn){
    return null;
};
module.exports = setup;
