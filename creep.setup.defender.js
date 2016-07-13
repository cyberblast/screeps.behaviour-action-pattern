var setup = _.cloneDeep(require('creep.setup'));

setup.type = 'defender';
setup.body = [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE]; 
setup.defaultBodyCosts = 650;
setup.maxMulti = 2;
setup.minEnergyCapacityAvailable = function(){
    return 0.8;
}
setup.maxCount = function(spawn){
    return 2;
}
setup.maxWeight = function(spawn){
    return 2600;
}

module.exports = setup;