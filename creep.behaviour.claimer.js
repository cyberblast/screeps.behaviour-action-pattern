var work = {
    setAction: function(creep, actionName) {
        if( creep.memory.action != actionName ){
            if( creep.memory.action )
                creep.room.activities[creep.memory.action]--;
            creep.memory.action = actionName;
            creep.memory.target = null;
        }
        creep.action = MODULES.creep.action[actionName];
    },
    run: function(creep) {
        var flag = _.find(Game.flags, {'color': FLAG_COLOR.claim });
        if( flag ) MODULES.creep.assignActionWithTarget(creep, MODULES.creep.action.claim);
        else MODULES.creep.assignActionWithTarget(creep, MODULES.creep.action.idle);
        if( creep.action ) creep.action.step(creep);
        return;
    }
}


module.exports = work;