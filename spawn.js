
var mod = {
    self: this,
    loop: function(){
        for(var iSpawn in Game.spawns){
            var spawn = Game.spawns[iSpawn];
            if( !spawn.spawning )
                this.createCreep(spawn);
        }
    },
    createCreep: function(spawn){
        var room = spawn.room;
        if (room.energyAvailable > room.energyCapacityAvailable/2 && 
            room.population.worker.count < (room.sourceAccessibleFields + (room.sources.length)) && 
            room.population.worker.weight < (room.sources.length * 4000) ) { 

            var build = this.creepSetup(spawn);
            if (build && build.parts.length > 0) {
                for( var son = 1; build.id == null || Game.creeps[build.id]; son++ ) {
                    build.id = build.setup + '.' + build.cost + '.' + son;
                }
                var newName = spawn.createCreep(build.parts, build.id, build);
                console.log(build.id == newName ? 
                    spawn.name + ' > Good morning ' + newName + '!': 
                    spawn.name + ' > Offspring failed. They call it "' + errorCode(newName) + '".');
            }
        }
    }, 
    creepSetup: function(spawn){
        // TODO: Ermitteln welcher Typ gebaut werden soll
        var build = {
            setup: 'worker',
            cost: 0,
            parts: [], 
            mother: spawn.name, 
            id: null
        }
        var simpleCost = 
            PART_COSTS.work +
            PART_COSTS.carry +
            PART_COSTS.move;

        var multi = Math.floor(spawn.room.energyAvailable / simpleCost);
        build.cost = simpleCost * multi;

        for (var iWork = 0; iWork < multi; iWork++) {
            build.parts.push(WORK);
        }
        for (var iCarry = 0; iCarry < multi; iCarry++) {
            build.parts.push(CARRY);
        }
        for (var iMove = 0; iMove < multi; iMove++) {
            build.parts.push(MOVE);
        }
        return build;
    }
};

module.exports = mod;