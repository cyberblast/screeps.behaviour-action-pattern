var mod = {
    self: this,
    loop: function(strategy){
        for(var iRoom in Game.rooms){
            var towers = Game.rooms[iRoom].find(
            FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}});
            towers.forEach(tower => this.run(tower));
        }
    }, 
    run: function(tower){
        if(tower) {
            // TODO: Calculate Values only once initial
            // TODO: convert to action pattern  

            // Attack
            var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if(closestHostile) {
                tower.attack(closestHostile);
                return;
            } 
            
            // Heal
            var closestCasualty = tower.pos.findClosestByRange(FIND_MY_CREEPS, {
                    filter: (creep) => creep.hits < creep.hitsMax
                });
            if(closestHostile) {
                tower.heal(closestHostile);
                return;
            } 

            // Repair
            if( tower.energy > tower.energyCapacity * 0.8 ) {
                var closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (structure) => structure.hits < structure.hitsMax
                });
                if(closestDamagedStructure) {
                    tower.repair(closestDamagedStructure);
                    return;
                }    
            }
        }
    }
}

module.exports = mod;