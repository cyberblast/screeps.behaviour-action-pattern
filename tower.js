let mod = {};
module.exports = mod;
mod.loop = function(room){
    var run = tower => this.run(tower);
    _.forEach(room.structures.towers, run);
};
mod.run = function(tower){
    if(tower) {
        // TODO: convert to action pattern
        if( tower.room.casualties.length > 0) {
            // Heal
            var target = tower.room.casualties[0];
            if(target.hitsMax - target.hits >= 400 || !tower.room.situation.invasion) {
                tower.heal(target);
                if( target.towers === undefined )
                    target.towers = [];
                target.towers.push(tower.id);
                return;
            }
        }
        if( tower.room.structures.urgentRepairable.length > 0 ) {
            // urgent Repair
            var target = tower.room.structures.urgentRepairable[0];
            tower.repair(target);
            if( target.towers === undefined )
                target.towers = [];
            target.towers.push(tower.id);
            return;
        }

        var closestHostile = tower.pos.findClosestByRange(tower.room.hostiles);
        if(closestHostile) {
            // Attack
            tower.attack(closestHostile);
        }
        /*
        else if( (tower.room.structures.repairable.length > 0) && (tower.energy > (tower.energyCapacity * 0.8)) ) {
            // Repair
            var isAddable = target => (target.towers === undefined || target.towers.length == 0);
            var target = _.find(tower.room.structures.repairable, isAddable);
            if( !_.isUndefined(target) ){
                tower.repair(target);
                if( target.towers === undefined )
                    target.towers = [];
                target.towers.push(tower.id);
            }
        }
        */
    }
};
