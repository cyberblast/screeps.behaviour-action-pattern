var setup = new MODULES.creep.template();

setup.type = 'conqueror';
setup.body = [CLAIM, ATTACK, MOVE, MOVE];
setup.defaultBodyCosts = 780;
setup.maxMulti = 1;
setup.minEnergyAvailable = function(){
    return 0.9;
}
setup.sValidSetup = function(spawn){
    return false;
    var room = spawn.room;    
    return (room.energyAvailable >= this.defaultBodyCosts && 
        room.energyAvailable >= (room.energyCapacityAvailable * this.minEnergyAvailable(spawn)) && (
            (Game.flags['Claim'] != null && !_.some(Memory.creeps, {'setup': 'conqueror'}))
        ));
}

module.exports = setup;
