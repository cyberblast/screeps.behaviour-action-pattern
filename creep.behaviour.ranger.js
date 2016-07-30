var behaviour = new Creep.Behaviour('ranger');

behaviour.run = function(creep) {
    var assignment;
    if( creep.room.controller.my && creep.room.situation.invasion )
        assignment = this.assignAction(creep, Creep.action.defending);
    else {
        var flag = _.find(Game.flags, FLAG_COLOR.destroy.filter) || _.find(Game.flags, FLAG_COLOR.invade.filter);
        if( flag ) assignment = this.assignAction(creep, Creep.action.invading);
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
                assignment = this.assignAction(creep, Creep.action.guarding);
        }
    }
    if( !assignment ) this.assignAction(creep, Creep.action.idle);
    
    if( creep.action ) creep.action.step(creep);
};

module.exports = behaviour;