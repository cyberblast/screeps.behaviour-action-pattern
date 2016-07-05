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
            /*
            var closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (structure) => structure.hits < structure.hitsMax
            });
            if(closestDamagedStructure) {
                tower.repair(closestDamagedStructure);
            }*/
    
            var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if(closestHostile) {
                tower.attack(closestHostile);
            }
        }
    }
}

module.exports = mod;