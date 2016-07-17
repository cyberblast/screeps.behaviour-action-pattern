var behaviour = new MODULES.creep.Behaviour();

behaviour.run = function(creep) {
    var assignment;
    if( creep.room.situation.invasion )
        assignment = this.assignActionWithTarget(creep, MODULES.creep.action.defending);
    else 
        assignment = this.assignActionWithTarget(creep, MODULES.creep.action.guarding);
    
    if( !assignment ) this.assignActionWithTarget(creep, MODULES.creep.action.idle);
    
    if( creep.action ) creep.action.step(creep);
};

module.exports = behaviour;