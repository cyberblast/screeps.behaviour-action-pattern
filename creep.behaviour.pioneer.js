module.exports = {
    name: 'pioneer',
    run: function(creep) {
        // Assign next Action
        if( creep.action == null  || creep.action.name == 'idle' ) {
            this.nextAction(creep);
        }
        // Do some work
        if( creep.action && creep.target ) {
            creep.action.step(creep);
        } else {
            logError('Creep without action/activity!\nCreep: ' + creep.name + '\ndata: ' + JSON.stringify(creep.data));
        }
    },
    nextAction: function(creep) {    
        let flag = FlagDir.find(FLAG_COLOR.claim.spawn, creep.pos, false, FlagDir.rangeMod);
        if( flag ) { 
            if( !flag.room || flag.room.name != creep.room.name ){
                if( Creep.action.travelling.assign(creep, flag)) {
                    Population.registerCreepFlag(creep, flag);
                    return true;
                }
            } 
            if( flag.room && flag.room.controller.my ) { // inside owned target room
                if( flag.room.spawns && flag.room.spawns.length > 0 ){ // spawn complete
                    flag.remove();
                    // also remove exploit flags
                    let remove = f => Game.flags[f.name].remove();
                    _.forEach(FlagDir.filter(FLAG_COLOR.invade.exploit.filter, flag.pos, true), remove);
                    
                    Population.registerCreepFlag(creep, null);
                    // TODO: remove registered flags @ other creeps
                }
                else { // no spawn => build it
                    if( flag.room.constructionSites.length == 0 ) // no constructionSites // TODO: filter for spawn-constructionSite
                        flag.room.createConstructionSite(flag, STRUCTURE_SPAWN); // create spawn construction site
                }            
            }
        } else {
            flag = FlagDir.find(FLAG_COLOR.claim.pioneer, creep.pos, false, FlagDir.rangeMod);
            if( flag && ( !flag.room || flag.room.name != creep.room.name) ){
                if( Creep.action.travelling.assign(creep, flag)) {
                    Population.registerCreepFlag(creep, flag);
                    return true;
                }
            } 
        }
        // if there are construction sites prefer them
        if( creep.room.constructionSites.length > 0 ) {
            // Last Action completed / No more energy
            if( creep.carry.energy == 0 )  { 
                if( Creep.action.harvesting.assign(creep) ) return true;
            }    
            // no action or harvesting complete
            else {
                // urgent upgrading 
                if( creep.room.ticksToDowngrade < 2000 ) {
                    if( Creep.action.upgrading.assign(creep) ) return true;
                } else { 
                    if( Creep.action.building.assign(creep) ) return true;
                }
            }
        }
        // else run as worker    
        Creep.behaviour.worker.nextAction(creep);
    }
}