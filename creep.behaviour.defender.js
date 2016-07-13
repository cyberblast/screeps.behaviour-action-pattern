var work = {
    actions: {
        guarding: require('creep.action.guarding'),
        defending: require('creep.action.defending.ranged')
    },
    setAction: function(creep, actionName) {
        if( creep.memory.action != actionName ){
            if( creep.memory.action )
                creep.room.activities[creep.memory.action]--;
            creep.memory.action = actionName;
            creep.memory.target = null;
        }
        creep.action = this.actions[actionName];
    },
    run: function(creep) {
        if( creep.room.situation.invasion )
            this.setAction(creep, 'defending');
        else 
            this.setAction(creep, 'guarding');
        
        creep.target = creep.action.newTarget(creep);
        
        if( creep.target ){
            if( !creep.target.creeps ) 
                creep.target.creeps = [];
            if( !(creep.name in creep.target.creeps) ) 
                creep.target.creeps.push(creep.name);
            creep.memory.target = creep.action.getTargetId(creep.target);
            creep.action.step(creep);
        }
    }
}


module.exports = work;