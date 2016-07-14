var work = {
    run: function(creep) {
        if( creep.room.situation.invasion )
            MODULES.creep.assignActionWithTarget(creep, MODULES.creep.action.defending);
        else 
            MODULES.creep.assignActionWithTarget(creep, MODULES.creep.action.guarding);
        
        if( creep.action ) creep.action.step(creep);
    }
}

module.exports = work;