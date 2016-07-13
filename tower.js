var mod = {
    self: this,
    loop: function(strategy){
        for(var iRoom in Game.rooms){
            //var towers = Game.rooms[iRoom].find(
            //FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}});
            Game.rooms[iRoom].towers.forEach(tower => this.run(tower));
        }
    }, 
    run: function(tower){
        if(tower) {
            // TODO: Calculate Values only once initial
            // TODO: convert to action pattern  

            // Heal
            var casualty = _.sortBy(tower.room.find(FIND_MY_CREEPS, {
                    filter: (creep) => creep.hits < creep.hitsMax && 
                    (creep.towers == null || creep.towers.length == 0)
                }), 'hits');
                /*
            var closestCasualty = tower.pos.findClosestByRange(FIND_MY_CREEPS, {
                    filter: (creep) => creep.hits < creep.hitsMax
                });*/
            if(casualty.length > 0) {
                tower.heal(casualty[0]);
                if( casualty.towers == null )casualty.towers = [];
                    casualty.towers.push(tower.id);
                return;
            } 
            // Repair
            if( (tower.room.repairableSites.count > 0) && (tower.energy > (tower.energyCapacity * (1-(0.2/tower.room.towers.length)))) ) {
                for( var iSite = 0; iSite < tower.room.repairableSites.count; iSite++){
                    var site = tower.room.repairableSites[tower.room.repairableSites.order[iSite]];
                    if(site.towers == null || site.towers.length == 0){
                        if( site.towers == null )site.towers = [];
                            site.towers.push(tower.id);
                        tower.repair(site);
                        return;
                    }
                }
            }
            // Attack
            var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
                filter: function(hostile){ return _.some(hostile.body, {'type': HEAL}); } 
            });
            if(closestHostile) {
                tower.attack(closestHostile);
                return;
            } 
            
            closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if(closestHostile) {
                tower.attack(closestHostile);
                return;
            } 
        }
    }
}

module.exports = mod;