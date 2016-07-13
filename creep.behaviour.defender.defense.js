var work = {
    actions: {
        rangedDefense: require('creep.action.defending.ranged')
    },
    run: function(creep) {
        if( creep.memory.action != 'rangedDefense' ){
            if( creep.memory.action )
                creep.room.activities[creep.memory.action]--;
            creep.memory.action = 'rangedDefense';
            creep.memory.target = null;
        }
        creep.action = this.actions.rangedDefense;
        creep.target = creep.action.newTarget(creep);
        
        if( creep.target ){
            if( !creep.target.creeps ) 
                creep.target.creeps = [];
            if( !(creep.name in creep.target.creeps) ) 
                creep.target.creeps.push(creep.name);
            // target ok. memorize
            creep.memory.target = creep.action.getTargetId(creep.target);
            
            creep.action.step(creep);
        }
    }
};

module.exports = work;