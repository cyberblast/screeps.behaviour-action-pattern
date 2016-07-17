var work = {
    run: function(creep) {
        var assignment;
        if( creep.room.controller.my && creep.room.situation.invasion )
            assignment = MODULES.creep.assignActionWithTarget(creep, MODULES.creep.action.healing);
        else {
            var flag = _.find(Game.flags, {'color': FLAG_COLOR.destroy }) || _.find(Game.flags, {'color': FLAG_COLOR.invade });
            if( flag ) assignment = MODULES.creep.assignActionWithTarget(creep, MODULES.creep.action.invading);
            else assignment = MODULES.creep.assignActionWithTarget(creep, MODULES.creep.action.guarding);
        }
        if( !assignment ) MODULES.creep.assignActionWithTarget(creep, MODULES.creep.action.idle);
        
        if( creep.action ) creep.action.step(creep);
    }
}

module.exports = work;