var behaviour = new MODULES.creep.Behaviour();

behaviour.run = function(creep) {    
    var flag = _.find(Game.flags, {'color': FLAG_COLOR.claim });   
    if( flag && flag.room.name != creep.room.name ){
        this.assignActionWithTarget(creep, MODULES.creep.action.settling);
        return;
    } 

    creep.run(MODULES.creep.behaviour.worker);
};


module.exports = behaviour;