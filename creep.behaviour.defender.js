var work = {
    actions: {
        guarding: require('creep.action.guarding')
    },
    run: function(creep) {
        if( creep.memory.action != 'guarding' ){
            if( creep.memory.action )
                creep.room.activities[creep.memory.action]--;
            creep.memory.action = 'guarding';
            creep.memory.target = null;
        }
        creep.action = this.actions.guarding;
        
        /*
        if( creep.memory.target != null ) {
            creep.target = creep.action.getTargetById(creep.memory.target);
        }
        
        if( !creep.action.isValidTarget(creep.target) ){ 
            // invalid. try to find a new one...
            */
            creep.target = creep.action.newTarget(creep);
        //}
        
        if( creep.target ){
            // target ok. memorize
            if( !creep.target.creeps ) 
                creep.target.creeps = [];
            if( !(creep.name in creep.target.creeps) ) 
                creep.target.creeps.push(creep.name);
            creep.memory.target = creep.action.getTargetId(creep.target);
            creep.action.step(creep);
        }
    }
};

module.exports = work;