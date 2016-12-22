module.exports = {
    name: 'pioneer',
    run: function(creep) {
        // Assign next Action
        let oldTargetId = creep.data.targetId;
        if( creep.action == null  || creep.action.name == 'idle' ) {
            this.nextAction(creep);
        }
        if( creep.data.targetId != oldTargetId ) {
            delete creep.data.path;
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
            if( !flag.room || flag.pos.roomName != creep.pos.roomName ){
                if( Creep.action.travelling.assign(creep, flag)) {
                    Population.registerCreepFlag(creep, flag);
                    return true;
                }
            }
            if( flag.room && flag.room.controller.my ) { // inside owned target room
                if( flag.room.structures.spawns && flag.room.structures.spawns.length > 0 ){ // spawn complete
                    flag.remove();
                    // also remove exploit flags
                    let remove = f => Game.flags[f.name].remove();
                    _.forEach(FlagDir.filter(FLAG_COLOR.invade.exploit, flag.pos, true), remove);
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
            if( flag && ( !flag.room || flag.pos.roomName != creep.pos.roomName) ){
                if( Creep.action.travelling.assign(creep, flag)) {
                    Population.registerCreepFlag(creep, flag);
                    return true;
                }
            }
        }
        // else run as worker
        Creep.behaviour.worker.nextAction(creep);
    }
}