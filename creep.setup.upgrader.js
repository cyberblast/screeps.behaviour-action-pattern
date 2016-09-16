var setup = new Creep.Setup('upgrader');
setup.multiBody = [WORK, WORK, WORK, MOVE];
setup.fixedBody = [WORK, WORK, CARRY, MOVE];
setup.minAbsEnergyAvailable = 400;
setup.maxMulti = function(room){ 
    let multi = 3;
    if( room.storage && room.storage.store.energy >= MAX_STORAGE_ENERGY )
    {
        let surplus = MAX_STORAGE_ENERGY - room.storage.store.energy;
        multi += Math.ceil( surplus / 20000 ); // one more multi for each 20k surplus (+1)
    }
    return multi; 
};
setup.minEnergyAvailable = function(spawn){
    return 0.5;
};
setup.maxCount = function(spawn){
    if ( spawn.room.situation.invasion || spawn.room.conserveForDefense ) 
        return 0;
    return spawn.room.containerController.length > 0 ? 1 : 0;
};
setup.maxWeight = function(spawn){
    return null;
};
module.exports = setup;
