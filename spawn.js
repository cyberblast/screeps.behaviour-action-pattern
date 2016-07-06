
var mod = {
    self: this,
    loop: function(state){
        for(var iSpawn in Game.spawns){
            this.createCreep(Game.spawns[iSpawn], state);
        }
    },
    createCreep: function(spawn, state){
        if (spawn.room.energyAvailable > state.minBuildEnergy && 
            spawn.room.find(FIND_CREEPS).length < state.maxSpawnCount) {

            var build = this.creepSetup(spawn, state);
            if (build && build.parts.length > 0) {
                var name = null;
                for( var son = 1; name == null || Game.creeps[name]; son++ ) {
                    name = build.setup + '.' + build.cost + '.' + son;
                }
                var newName = spawn.createCreep(build.parts, name, build);
                console.log('Spawning ' + newName);
            }
        }
    }, 
    creepSetup: function(spawn, state){
        // TODO: Ermitteln welcher Typ gebaut werden soll
        var build = {
            setup: 'worker',
            cost: 0,
            parts: []
        }
        var simpleCost = 
            state.partCost.work +
            state.partCost.carry +
            state.partCost.move;

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