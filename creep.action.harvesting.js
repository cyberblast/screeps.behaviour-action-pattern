var mod = {
    run: function(creep, state){    
        var source = null;

        if( creep.memory.target != null && creep.memory.targetType == 'source') // has source target
            source = Game.getObjectById(creep.memory.source);

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
        // TODO: gleichmäßig verteilen
        for( var newTargetId in roomSources ) {
            var site = roomSources[newTargetId];
            if( site.creeps.length+1 <= site.maxCreeps && site.energy > energy){
                targetId = site.id;
                energy = source.energy;
            }
        };
        return targetId;
	}
}

module.exports = mod;