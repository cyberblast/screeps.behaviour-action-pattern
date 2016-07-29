var behaviour = new MODULES.creep.Behaviour();

behaviour.run = function(creep) {    
    // TODO: limit to 3 per flag or equal distribution
    // TODO: Add memorization
    var flag = _.find(Game.flags, FLAG_COLOR.claim.spawn.filter);   
    if( flag.room && flag.room.controller.my ) {
        if( flag.room.spawns && flag.room.spawns.length > 0 ){
            flag.remove();
            // also remove exploit flags
            var remove = f => f.remove();
            _.forEach(creep.room.find(FIND_FLAGS, { filter: FLAG_COLOR.invade.exploit.filter }), remove);
        }
        else if( flag.room.constructionSites.count == 0 )
            flag.room.createConstructionSite(flag, STRUCTURE_SPAWN);
    }

    if( flag && (!flag.room || flag.room.name != creep.room.name) ){
        this.assignAction(creep, MODULES.creep.action.settling, flag);
        return;
    } 

    creep.run(MODULES.creep.behaviour.worker);
};


module.exports = behaviour;