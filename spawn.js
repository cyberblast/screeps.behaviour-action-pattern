
var mod = {
    self: this,
    loop: function(){
        for(var iSpawn in Game.spawns){
            this.createCreep(Game.spawns[iSpawn]);
        }
    },
    createCreep: function(spawn){
        var room = spawn.room;
        if (room.energyAvailable > room.energyCapacityAvailable/2 && 
            room.creeps.length < room.sourceAccessibleFields + (room.sources.length*2)) {

            var build = this.creepSetup(spawn);
            if (build && build.parts.length > 0) {
                var name = null;
                for( var son = 1; name == null || Game.creeps[name]; son++ ) {
                    name = build.setup + '.' + build.cost + '.' + son;
                }
                var newName = spawn.createCreep(build.parts, name, build);
                console.log(name == newName ? 
                    spawn.name + ' > Good morning ' + newName + '!': 
                    spawn.name + ' > "Offspring failed. They call it "' + newName + '".');
            }
        }
    }, 
    creepSetup: function(spawn){
        // TODO: Ermitteln welcher Typ gebaut werden soll
        var build = {
            setup: 'worker',
            cost: 0,
            parts: []
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