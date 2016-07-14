var setup = _.cloneDeep(require('creep.setup'));

setup.type = 'conqueror';
setup.body = [WORK, CARRY, CLAIM, ATTACK, MOVE, MOVE, MOVE];
setup.defaultBodyCosts = 980;
setup.maxMulti = 1;
setup.minEnergyAvailable = function(){
    return 0.9;
}
setup.maxCount = function(spawn){
    return ( (Game.flags['Claim'] && _.some(Memory.creeps, {'setup': 'conqueror'})) ? 0 : 1);
}
setup.maxWeight = function(spawn){
    return 980;
}

module.exports = setup;
