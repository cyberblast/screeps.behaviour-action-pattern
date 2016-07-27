var behaviour = new MODULES.creep.Behaviour();

behaviour.run = function(creep) {    
    var flag = _.find(Game.flags, {'color': FLAG_COLOR.settle });   // TODO: limit to 3 per flag or equal distribution
    if( flag.room && flag.room.controller.my ) {
        if( flag.room.spawns && flag.room.spawns.length > 0 )
            flag.remove();
        else if( flag.room.constructionSites.count == 0 )
            flag.room.createConstructionSite(flag, STRUCTURE_SPAWN);
    }

    if( flag && (!flag.room || flag.room.name != creep.room.name) ){
        this.assignActionWithTarget(creep, MODULES.creep.action.settling);
        return;
    } 

    creep.run(MODULES.creep.behaviour.worker);
};


module.exports = behaviour;