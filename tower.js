var mod = {
    loop: function(room){
        var run = tower => this.run(tower);
        _.forEach(room.towers);
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
            if(casualty.length > 0) {
                tower.heal(casualty[0]);
                if( casualty.towers == null )casualty.towers = [];
                    casualty.towers.push(tower.id);
                return;
            } 
            // urgent Repair
            if( (tower.room.urgentRepairableSites.length > 0) ) {                
                var self = this;
                var isAddable = target => target.towers.length == 0;
                var target = _.find(tower.room.urgentRepairableSites, isAddable);
                if( !_.isUndefined(target) ){
                    target.towers.push(tower.id);
                    tower.repair(target);
                    return;
                }
            }            
            // Attack        
            var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if(closestHostile) {
                tower.attack(closestHostile);
                return;
            } 
            // Repair
            if( (tower.room.repairableSites.length > 0) && (tower.energy > (tower.energyCapacity * (1-(0.2/tower.room.towers.length)))) ) {
                var isAddable = target => target.towers.length == 0;
                var target = _.find(tower.room.repairableSites, isAddable);
                if( !_.isUndefined(target) ){
                    target.towers.push(tower.id);
                    tower.repair(target);
                    return;
                }
            }
        }
    }
}
module.exports = mod;