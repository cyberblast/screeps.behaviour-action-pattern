
var roleHarvester = {

    /** @param {Creep} creep **/
    run: function(creep) {
	    if(creep.carry.energy < creep.carryCapacity) { // need energy
	        var source = null;

	        if( creep.memory.source != null) // has source target
	            source = Game.getObjectById(creep.memory.source);

	        if( source == null) { // need source target
	            var sourceId = this.getResourceId(creep.room);
	            if( sourceId != null ){
                    source = Game.getObjectById(sourceId);
                    creep.room.memory.sources[sourceId].creeps.push(creep.id);
                    creep.memory.source = sourceId;
	            } else console.log('No Source found for creep ' + creep.name);
	        } 

            if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
                creep.moveTo(source);
            }
        } else { // energy full
            if( creep.memory.source != null){ // clear harvest source instruction
                var source = creep.room.memory.sources[creep.memory.source];
                if(source) {
                    var index = source.creeps.indexOf(creep.id);
                    if( index > -1 ) source.creeps.splice(index);
                }
                creep.memory.source = null;
	        }
            var targets = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType == STRUCTURE_EXTENSION ||
                                structure.structureType == STRUCTURE_SPAWN ||
                                structure.structureType == STRUCTURE_TOWER) && structure.energy < structure.energyCapacity;
                    }
            });
            if(targets.length > 0) {
                if(creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0]);
                }
            } else return false;
            return true;
        }
	}, 
	getResourceId: function(room){
        for(var iSource in room.memory.sources){
            var source = room.memory.sources[iSource];
            //console.log('source' + iSource + ' creeps:' + source.creeps.length + ' of ' + source.maxCreeps);
            if( (source.creeps.length < Math.floor(source.maxCreeps)) && (Game.getObjectById(iSource).energy > 100)) 
                return iSource;
        } return null;
	}
};

module.exports = roleHarvester;