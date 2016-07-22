var behaviour = new MODULES.creep.Behaviour();

behaviour.run = function(creep) {    
    var flag = _.find(Game.flags, {'color': FLAG_COLOR.settle });   
    if( flag.room && flag.room.spawns && flag.room.spawns.length > 0 )
        flag.remove();
    if( flag.room && flag.room.constructionSites.count == 0 )
        flag.room.createConstructionSite(flag, STRUCTURE_SPAWN);

    if( flag && flag.room.name != creep.room.name ){
        this.assignActionWithTarget(creep, MODULES.creep.action.settling);
        return;
    } 

    creep.run(MODULES.creep.behaviour.worker);
};


module.exports = behaviour;