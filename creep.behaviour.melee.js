var behaviour = new Creep.Behaviour('melee');

behaviour.run = function(creep) {
    var assignment;
    if( creep.room.controller.my && creep.room.situation.invasion )
        assignment = creep.assignAction(Creep.action.defending);
    else {
        var flag = _.find(Game.flags, FLAG_COLOR.destroy.filter) || _.find(Game.flags, FLAG_COLOR.invade.filter);
        if( flag ) assignment = creep.assignAction(Creep.action.invading);
        else {
            if( creep.memory.action ){
                if( !creep.validateMemoryAction() ){
                    creep.unregisterAction();
                    assignment = false;
                } else assignment = true;
            }
            if(!assignment)
                assignment = creep.assignAction(Creep.action.guarding);
        }
    }
    if( !assignment ) creep.assignAction(Creep.action.idle);
    
    if( creep.action ) creep.action.step(creep);
};

module.exports = behaviour;