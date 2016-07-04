var mod = {
    loop: function(){
        for(var iRoom in Game.rooms){
            var room = Game.rooms[iRoom];
            room.memory.sources = {};
            
            // Sources in Room
            var allSources = room.find(FIND_SOURCES);//.concat(room.find(FIND_MINERALS));
            for(var iSource in allSources){
                var source = allSources[iSource];
                if(!room.memory.sources[source.id]) {
                    room.memory.sources[source.id] = {};
                    room.memory.sources[source.id].creeps = [];
                    room.memory.sources[source.id].maxCreeps = 5;
                }
            }
            room.memory.creeps = {
                harvester: 0,
                upgrader: 0,
                builder: 0 
            };
        }
    }
}

module.exports = mod;