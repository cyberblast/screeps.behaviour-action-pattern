
var mod = {
    get: function(){
        var action = _.cloneDeep(require('creep.action'));
        action.name = 'defending.ranged';
        
        action.isValidTarget = function(target){
            return (
                target.hits > 0 &&
                target.hits != null && 
                target.my == false );
        }; 
        action.isAddableAction = function(){ return true; };
        action.isAddableTarget = function(){ return true; };
        
        action.newTarget = function(creep){
            var closestHostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
                filter: function(hostile){ return _.some(hostile.body, {'type': HEAL}); } 
            });
            
            if(!closestHostile) {
                closestHostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            } 
            
            return closestHostile;
        };
        
        action.step = function(creep){
            // if target not in range && next field != rampart
            // move towards enemy
            // else if range < max range
            // move away from enemy
            if(CHATTY) creep.say(this.name);
            var range = creep.pos.getRangeTo(creep.target);
            //creep.say(range);
            if( range > 3 ){
                var path = creep.room.findPath(creep.pos, creep.target.pos);
                var isRampart = _.some( creep.room.lookForAt(LOOK_STRUCTURES, path[0].x, path[0].y), {'structureType': STRUCTURE_RAMPART });
                if(!isRampart){
                    creep.move(path[0].direction);
                }
            }
            if( range < 3 ){
                var path = creep.room.findPath(creep.pos, creep.target.pos);
                creep.move(creep.target.pos.getDirectionTo(creep));
            }
            
            // attack
            var targets = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3);
            if(targets.length > 2) { // TODO: calc damage dealt
                if(CHATTY) creep.say('MassAttack');
                creep.rangedMassAttack();
            }
            if(targets.length > 0){
                creep.rangedAttack(targets[0]);
            }
        }
        
        return action;
    }
}

module.exports = mod.get();