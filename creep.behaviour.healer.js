var behaviour = new MODULES.creep.Behaviour();

behaviour.run = function(creep) {
    var assignment;
    if( creep.room.controller.my && creep.room.situation.invasion )
        assignment = this.assignAction(creep, MODULES.creep.action.healing);
    else {
        var flag = _.find(Game.flags, {'color': FLAG_COLOR.destroy }) || _.find(Game.flags, {'color': FLAG_COLOR.invade });
        if( flag ) assignment = this.assignAction(creep, MODULES.creep.action.healing); // bug - settle
        else {
            if( creep.memory.action ){
                if( !this.validateMemoryAction(creep) ){
                    creep.room.activities[creep.memory.action]--;
                    creep.unregisterTarget(creep.Target);
                    creep.memory.action = null;
                    creep.memory.target = null;
                    creep.action = null;
                    creep.target = null;

                    assignment = false;
                } else assignment = true;
            }
            if(!assignment)
                assignment = this.assignAction(creep, MODULES.creep.action.guarding);
        }
    }
    if( !assignment ) this.assignAction(creep, MODULES.creep.action.idle);
    
    if( creep.action ) creep.action.step(creep);
};

module.exports = behaviour;