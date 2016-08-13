var behaviour = new Creep.Behaviour('pioneer');
behaviour.run = function(creep) {    
    // TODO: limit to 3 per flag or equal distribution
    // TODO: Add memorization
    var flag = _.find(Game.flags, FLAG_COLOR.claim.spawn.filter);  
    if( flag ) { 
        if( !flag.room || flag.room.name != creep.room.name ){
            if( creep.assignAction(Creep.action.travelling, flag)) {
                creep.action.step(creep);
                return;
            }
        } 
        if( flag.room && flag.room.controller.my ) { // inside owned target room
            if( flag.room.spawns && flag.room.spawns.length > 0 ){ // spawn complete
                flag.remove();
                // also remove exploit flags
                var remove = f => f.remove();
                _.forEach(creep.room.find(FIND_FLAGS, { filter: FLAG_COLOR.invade.exploit.filter }), remove);
            }
            else { // no spawn => build it
                if( flag.room.constructionSites.length == 0 ) // no constructionSites // TODO: filter for spawn-constructionSite
                    flag.room.createConstructionSite(flag, STRUCTURE_SPAWN); // create spawn construction site
            }            
        }
    }
    // if there are construction sites prefer them
    if( creep.room.constructionSites.length > 0 ) {
        // Has invalid assigned Action 
        if(creep.memory.action && creep.memory.action != 'harvesting' && creep.memory.action != 'building') {
            creep.action = null;
        }        
        // Last Action completed / No more energy
        if( creep.carry.energy == 0 && creep.memory.action != 'harvesting') { 
            creep.assignAction(Creep.action.harvesting);
        }    
        // no action or harvesting complete
        else if(!creep.memory.action || (creep.memory.action == 'harvesting' && _.sum(creep.carry) == creep.carryCapacity )){
            // urgent upgrading 
            if( creep.room.ticksToDowngrade < 2000 ) 
                creep.assignAction(Creep.action.upgrading);
            else // build
                creep.assignAction(Creep.action.building);
        }
        // Do some work
        if( creep.action && creep.target ) {
            creep.action.step(creep);
            return;
        }
    }
    // else run as worker
    creep.run(Creep.behaviour.worker); 
};
behaviour.run.displayName = "creep.behaviour.pioneer.run";
module.exports = behaviour;