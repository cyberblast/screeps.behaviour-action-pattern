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
        var roomSources = state.rooms[creep.room.id].sources;
        var targetId = null;
        var energy = -1;
        roomSources.forEach(function(source){
            if( site.creeps.length+1 <= source.maxCreeps && source.energy > energy){
                targetId = source.id;
                energy = source.energy;
            }
        });
        return targetId;
	}
}

module.exports = mod;