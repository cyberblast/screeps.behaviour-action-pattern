let setup = new Creep.Setup('hauler');
module.exports = setup;
setup.minControllerLevel = 2;
setup.maxMulti = function(room) {
    let max = 7;
    if( room.minerals.length > 0 )
        max += 2;
    let contSum = _.sum(room.structures.container.in, 'sum');
    contSum += _.sum(room.droppedResources, 'amount');
    max += Math.floor(contSum / 1000);
    max += Creep.setup.upgrader._maxMulti(room);
    return Math.min(max, 16);
};
setup.maxCount = function(room){
    if( !room.population ) return 0;
    let count = 0;
    let miners = (room.population.typeCount.miner || 0);
    let workers = (room.population.typeCount.worker || 0);
    let mineralMiners = (room.population.typeCount.mineralMiner || 0);
    let cont = room.structures.container.in.length + room.structures.links.storage.length;
    if( miners > 0  || ( cont > 0 && workers > Creep.setup.worker._maxCount(room)) ) {
        count += Creep.setup.upgrader._maxCount(room);
        if( room.structures.links.all.length < 3 ||
           (room.storage && room.storage.active && room.storage.charge > 1 &&
            room.structures.container.controller && _.sum(room.structures.container.controller, 'store.energy') == 0 )) count++;
        //add one when mineral miner active
        
        if( mineralMiners > 0 ) count++;

        /* Add hauler when there is energy on the ground */
        let dropped = 0;
        let isSource = pos => room.sources.some(s => s.pos.x === pos.x && s.pos.y === pos.y);
        let countNearSource = resource => {
            if( resource.resourceType === RESOURCE_ENERGY ) {
                if( resource.pos.adjacent.some(isSource) ) dropped += resource.amount;
            }
        };
        room.droppedResources.forEach(countNearSource);
        if( room.storage && room.storage.active && dropped > 1000 ) count++;
        if( count === 0 ) count = 1;
    }
    return count;
};
setup.maxWeight = function(room){
    return setup._maxCount(room) * 2000;
};
setup.default = {
    fixedBody: [WORK, CARRY, MOVE],
    multiBody: [CARRY, CARRY, MOVE],
    minAbsEnergyAvailable: 200,
    minEnergyAvailable: 0.4,
    maxMulti: room => setup.maxMulti(room),
    maxCount: room => setup.maxCount(room),
    maxWeight: room => setup.maxWeight(room),
};
setup.high = {
    fixedBody: [WORK, CARRY, MOVE],
    multiBody: [CARRY, CARRY, MOVE],
    minAbsEnergyAvailable: 200,
    minEnergyAvailable: 0.1,
    maxMulti: room => setup.maxMulti(room),
    maxCount: room => setup.maxCount(room),
    maxWeight: room => setup.maxWeight(room),
};
setup.RCL = {
    1: setup.none,
    2: setup.default,
    3: setup.default,
    4: setup.default,
    5: setup.default,
    6: setup.default,
    7: setup.default,
    8: setup.high
};
