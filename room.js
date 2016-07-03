var mod = {
    init: function(room, force){
        var spawns = room.find(FIND_MY_SPAWNS);
        if(!room.memory.sources || spawns.length != room.memory.spawns.count ||  force) {
            room.memory.sources = {};
            room.memory.spawns = {};
            room.memory.spawns.count = spawns.length;
            room.memory.maxSourceCreeps = 0;
            
            var allSources = room.find(FIND_SOURCES);
            for(var iSource in allSources){
                var source = allSources[iSource];
                if(!room.memory.sources[source.id]) {
                    room.memory.sources[source.id] = {};
                    room.memory.sources[source.id].creeps = 0;
                    room.memory.sources[source.id].maxCreeps = 3;
                }
                
                var nextSpawn = null;
                var nextSpawnDistance = null;
                
                for(var iSpawn in spawns){
                    var distance = this.distance(spawns[iSpawn], source);
                    if( nextSpawnDistance == null || distance < nextSpawnDistance) {
                        nextSpawn = spawns[iSpawn].id;
                        nextSpawnDistance = distance;
                    } 
                }
                
                room.memory.sources[source.id].nextSpawn = nextSpawn;
                room.memory.sources[source.id].nextSpawnDistance = nextSpawnDistance;
                room.memory.sources[source.id].maxCreeps = nextSpawnDistance/4;
                room.memory.maxSourceCreeps += room.memory.sources[source.id].maxCreeps;
            }
        }
    },
    distance: function(a, b){
        return a.pos.getRangeTo(b);
    }
}

module.exports = mod;