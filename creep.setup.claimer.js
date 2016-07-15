var setup = new MODULES.creep.template();

setup.type = 'claimer';
setup.body = [CLAIM, MOVE];
setup.defaultBodyCosts = 650;
setup.maxMulti = 1;
setup.minEnergyAvailable = function(){
    return 0.9;
}
setup.sValidSetup = function(spawn){
    var room = spawn.room;    
    var globalClaimers = _.countBy(Memory.creeps, 'setup').claimer;
    var flag = Game.flags['Claim'];
    return (room.energyAvailable >= this.defaultBodyCosts && 
        room.energyAvailable >= (room.energyCapacityAvailable * this.minEnergyAvailable(spawn)) && 
        flag != null && globalClaimers != null && globalClaimers < 2 
    );
}

module.exports = setup;
