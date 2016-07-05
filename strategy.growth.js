var mod = {
    creepSetup: function(spawn){
        var build = {
            setup: 'worker',
            cost: 0,
            parts: []
        }
        var simpleCost = 
            this.partCost.work +
            this.partCost.carry +
            this.partCost.move;

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
}

module.exports = mod;