var mod = {
    run: function(creep){
        creep.memory.action == 'harvesting';        
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
        return true;
    },
	getResourceId: function(room){
        for(var iSource in room.memory.sources){
            var source = room.memory.sources[iSource];
            //console.log('source' + iSource + ' creeps:' + source.creeps.length + ' of ' + source.maxCreeps);
            if( (source.creeps.length < Math.floor(source.maxCreeps)) && (Game.getObjectById(iSource).energy > 100)) 
                return iSource;
        } return null;
	}
}

module.exports = mod;