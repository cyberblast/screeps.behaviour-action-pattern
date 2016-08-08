var mod = {
    loop: function(room){
        var run = tower => this.run(tower);
        _.forEach(room.towers, run);
    },
    run: function(tower){
        if(tower) {
            // TODO: Calculate Values only once initial
            // TODO: convert to action pattern  
            if( tower.room.casualties.length > 0) {
                // Heal
                var target = tower.room.casualties[0];
                tower.heal(target);
                if( target.towers === undefined ) target.towers = [];
                    target.towers.push(tower.id);
            } 
            else if( tower.room.urgentRepairableSites.length > 0 ) { 
                // urgent Repair
                var target = tower.room.urgentRepairableSites[0]; 
                tower.repair(target);
                if( target.towers === undefined ) target.towers = [];
                    target.towers.push(tower.id);
            } 
            else {
                var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
                if(closestHostile) {
                    // Attack    
                    tower.attack(closestHostile);
                } 
                else if( (tower.room.repairableSites.length > 0) && (tower.energy > (tower.energyCapacity * (1-(0.2/tower.room.towers.length)))) ) {
                    // Repair
                    var isAddable = target => (target.towers === undefined || target.towers.length == 0);
                    var target = _.find(tower.room.repairableSites, isAddable);
                    if( !_.isUndefined(target) ){
                        target.towers.push(tower.id);
                        tower.repair(target);
                    }
                }
            }
        }
    }
}
module.exports = mod;