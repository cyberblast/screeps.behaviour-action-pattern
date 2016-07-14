var setup = _.cloneDeep(require('creep.setup'));

setup.type = 'conqueror';
setup.body = [CLAIM, ATTACK, MOVE, MOVE];
setup.defaultBodyCosts = 680;
setup.maxMulti = 1;
setup.minEnergyAvailable = function(){
    return 0.9;
}
setup.sValidSetup = function(spawn){
    var room = spawn.room;    
    return (room.energyAvailable >= this.defaultBodyCosts && 
        room.energyAvailable >= (room.energyCapacityAvailable * this.minEnergyAvailable(spawn)) && (
            (Game.flags['Claim'] && !_.some(Memory.creeps, {'setup': 'conqueror'}))
        ));
}

module.exports = setup;
