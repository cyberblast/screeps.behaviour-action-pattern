var harvester =  require('creep.role.harvester');

var roleUpgrader = {

    /** @param {Creep} creep **/
    run: function(creep) {

        if(creep.memory.upgrading && creep.carry.energy == 0) {
            creep.memory.upgrading = false;
	    }
	    if(!creep.memory.upgrading && creep.carry.energy == creep.carryCapacity) {
	        creep.memory.upgrading = true;
	    }

	    if(creep.memory.upgrading) {
            if( creep.memory.source != null){
                creep.room.memory.sources[creep.memory.source].creeps--;
                creep.memory.source = null;
	        }
            if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller);
            }
        }
        else {
	        harvester.run(creep);
        }
	}
};

module.exports = roleUpgrader;