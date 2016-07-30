var behaviour = new Creep.Behaviour('pioneer');

behaviour.run = function(creep) {    
    // TODO: limit to 3 per flag or equal distribution
    // TODO: Add memorization
    var flag = _.find(Game.flags, FLAG_COLOR.claim.spawn.filter);  
    if( flag ) {
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

        if( !flag.room || flag.room.name != creep.room.name ){
            if( this.assignAction(creep, Creep.action.settling, flag)) {
                creep.action.step(creep);
                return;
            }
        } 
    }
    creep.run(Creep.behaviour.worker); // TODO: implement own action priorization (more builder required e.g. for spawn!!)
};


module.exports = behaviour;