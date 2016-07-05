var mod = {
    minBuildEnergy: 200, 
    maxSpawnCount: 12,
    rolebalancing: {
        harvester: 40,
        upgrader: 20,
        builder: 40
    }, 
    partCost: {
      work: 100,
      carry: 50,
      move: 50
    },
    nextRole: function(room){        
        var roomCreeps = room.memory.creeps;
        var total = roomCreeps.harvester + roomCreeps.builder + roomCreeps.upgrader; 

        if( total == 0 ) return  [
            { role: 'builder', 
                currentWeight: 0, 
                currentQuote: 0, 
                targetQuote: this.rolebalancing.builder,
                requirement: 100 
            },
            { role: 'upgrader', 
                currentWeight: 0, 
                currentQuote: 0, 
                targetQuote: this.rolebalancing.upgrader,
                requirement: 100 
            },
            { role: 'harvester', 
                currentWeight: 1, 
                currentQuote: 1, 
                targetQuote: this.rolebalancing.harvester,
                requirement: 100 
            }
        ];

        var builderQuote = roomCreeps.builder*100 / total;
        var harvesterQuote = roomCreeps.harvester*100 / total; 
        var upgraderQuote = roomCreeps.upgrader*100 / total;
        var builderRequirement = this.rolebalancing.builder - builderQuote;
        var harvesterRequirement = this.rolebalancing.harvester - harvesterQuote; 
        var upgraderRequirement = this.rolebalancing.upgrader - upgraderQuote;

        var roles = [
            { role: 'builder', 
                currentWeight: roomCreeps.builder, 
                currentQuote: builderQuote, 
                targetQuote: this.rolebalancing.builder,
                requirement: builderRequirement 
            },
            { role: 'upgrader', 
                currentWeight: roomCreeps.upgrader, 
                currentQuote: upgraderQuote, 
                targetQuote: this.rolebalancing.upgrader,
                requirement: upgraderRequirement 
            },
            { role: 'harvester', 
                currentWeight: roomCreeps.harvester, 
                currentQuote: harvesterQuote, 
                targetQuote: this.rolebalancing.harvester,
                requirement: harvesterRequirement 
            }
        ];
        roles.sort(function(a, b) {
            return b.requirement - a.requirement;
        });
        return roles;
    }, 
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