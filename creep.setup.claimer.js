var setup = new MODULES.creep.Setup();

setup.type = 'claimer';
setup.multiBody = [CLAIM, MOVE];
setup.minAbsEnergyAvailable = 650;
setup.maxMulti = 1;
setup.globalMeasurement = true;
setup.minEnergyAvailable = function(){
    return 0.9;
}
setup.isValidSetup = function(spawn){ return false;
    var room = spawn.room;    
    var globalClaimers = _.countBy(Memory.creeps, 'setup').claimer;
    var flag = Game.flags['Claim'];
    var valid = (room.energyAvailable >= this.defaultBodyCosts && 
        room.energyAvailable >= (room.energyCapacityAvailable * this.minEnergyAvailable(spawn)) && 
        flag != null && (globalClaimers == null || globalClaimers < 0) 
    );
    return valid;
}
setup.maxCount = function(spawn){ return 0; }, 
setup.maxWeight = function(spawn){
    return 700;
}
module.exports = setup;
