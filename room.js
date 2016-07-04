var mod = {
    loop: function(){
        for(var iRoom in Game.rooms){
            var room = Game.rooms[iRoom];
            room.memory.sources = {};
            room.memory.maxSourceCreeps = 0;
            
            // Sources in Room
            var allSources = room.find(FIND_SOURCES);//.concat(room.find(FIND_MINERALS));
            for(var iSource in allSources){
                var source = allSources[iSource];
                if(!room.memory.sources[source.id]) {
                    room.memory.sources[source.id] = {};
                    room.memory.sources[source.id].creeps = [];
                    room.memory.sources[source.id].maxCreeps = 3;
                }
                
                var nextSpawn = null;
                var nextSpawnDistance = null;
                
                var spawns = room.find(FIND_MY_SPAWNS);
                for(var iSpawn in spawns){
                    var distance = this.distance(spawns[iSpawn], source);
                    if( nextSpawnDistance == null || distance < nextSpawnDistance) {
                        nextSpawn = spawns[iSpawn].id;
                        nextSpawnDistance = distance;
                    } 
                }
                
                room.memory.sources[source.id].nextSpawn = nextSpawn;
                room.memory.sources[source.id].nextSpawnDistance = nextSpawnDistance;
                room.memory.sources[source.id].maxCreeps = nextSpawnDistance/4.5;
                // TODO: Calculate MaxCreep depending on fastest path to spawn 
                room.memory.maxSourceCreeps += room.memory.sources[source.id].maxCreeps; 
            }
            room.memory.creeps = {
                harvester: 0,
                upgrader: 0,
                builder: 0 
            };
        }
    },
    distance: function(a, b){
        return a.pos.getRangeTo(b);
    }
}

module.exports = mod;