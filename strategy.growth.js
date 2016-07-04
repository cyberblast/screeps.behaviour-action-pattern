var mod = {
    minBuildEnergy: 200, 
    maxSpawnCount: 12,
    rolebalancing: {
        harvester: 40,
        upgrader: 20,
        builder: 40
    }, 
    nextRole: function(room){        
        var roomCreeps = room.memory.creeps;
        var total = roomCreeps.harvester + roomCreeps.builder + roomCreeps.upgrader; 

        var builderQuote = roomCreeps.builder*100 / total;
        var harvesterQuote = roomCreeps.harvester*100 / total; 
        var upgraderQuote = roomCreeps.upgrader*100 / total;
        var builderRequirement = this.rolebalancing.builder - builderQuote;
        var harvesterRequirement = this.rolebalancing.harvester - harvesterQuote; 
        var upgraderRequirement = this.rolebalancing.upgrader - upgrader;

        var roles = [
            { role: 'builder', 
                currentWeight: roomCreeps.builder, 
                currentQuote: builderQuote, 
                targetQuote: rolebalancing.builder,
                requirement: builderRequirement 
            },
            { role: 'upgrader', 
                currentWeight: roomCreeps.upgrader, 
                currentQuote: upgraderQuote, 
                targetQuote: rolebalancing.upgrader,
                requirement: upgraderRequirement 
            },
            { role: 'harvester', 
                currentWeight: roomCreeps.harvester, 
                currentQuote: harvesterQuote, 
                targetQuote: rolebalancing.harvester,
                requirement: harvesterRequirement 
            }
        ];
        roles.sort(function(a, b) {
            return b.builderRequirement - a.builderRequirement;
        });
        return roles;
    }, 
    creepSetup: function(role, maxenergy){
        var build = {
            setup: 'worker',
            cost: 0,
            parts: []
        }
        var simpleCost = 
            self.partCost.work +
            self.partCost.carry +
            self.partCost.move;

        var multi = Math.floor(energy / simpleCost);
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