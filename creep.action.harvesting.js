var mod = {
    run: function(creep, state){    
        var source = null;

        if( creep.memory.target != null && creep.memory.targetType == 'source') {// has source target
            source = Game.getObjectById(creep.memory.target);
            if( source && source.energy == 0 ){
                source = null;
                creep.memory.target = null;
                creep.memory.targetType = null;
            }
        }

        if( !source ) { // need source target
            var sourceId = this.getResourceId(creep, state);
            if( sourceId != null ){
                source = Game.getObjectById(sourceId);
                creep.memory.target = sourceId;
                creep.memory.targetType = 'source';
                // TODO: Update State
            } else console.log('No free energy source found for creep ' + creep.name);
        } 

        if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
            creep.moveTo(source);
        }
        return true;
    },
	getResourceId: function(creep, state){
        var roomSources = state.rooms[creep.room.name].sources;
        var targetId = null;
        var energy = -1;
        var assigned = 999;
        // TODO: gleichmäßig verteilen?
        for( var newTargetId in roomSources ) {
            var site = roomSources[newTargetId];
            if( site.creeps.length+1 <= site.maxCreeps && site.creeps.length < assigned && site.energy > 0 ){//&& site.energy > energy){
                targetId = site.id;
                energy = site.energy;
                assigned = site.creeps.length;
            }
        };
        return targetId;
	}
}

module.exports = mod;