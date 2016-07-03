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
        //return a.pos.getRangeTo(b);
        
        return PathFinder.search(a.pos, b.pos,{
          // We need to set the defaults costs higher so that we
          // can set the road cost lower in `roomCallback`
          plainCost: 2,
          swampCost: 10,
    	  
          roomCallback: function(roomName) {
    
            let room = Game.rooms[roomName];
            // In this example `room` will always exist, but since PathFinder 
            // supports searches which span multiple rooms you should be careful!
            if (!room) return;
            let costs = new PathFinder.CostMatrix;
    
            room.find(FIND_STRUCTURES).forEach(function(structure) {
              if (structure.structureType === STRUCTURE_ROAD) {
                // Favor roads over plain tiles
                costs.set(structure.pos.x, structure.pos.y, 1);
              } else if (structure.structureType !== STRUCTURE_CONTAINER && 
                         (structure.structureType !== STRUCTURE_RAMPART ||
                          !structure.my)) {
                // Can't walk through non-walkable buildings
                costs.set(structure.pos.x, structure.pos.y, 0xff);
              }
            });
    
            // Avoid creeps in the room
            room.find(FIND_CREEPS).forEach(function(creep) {
              costs.set(creep.pos.x, creep.pos.y, 0xff);
            });
    
            return costs;
          }
        });
    }
}

module.exports = mod;